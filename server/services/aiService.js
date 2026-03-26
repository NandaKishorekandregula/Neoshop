// server/services/aiService.js
const axios = require('axios');
const Groq = require('groq-sdk');
const User = require('../models/User');
const Product = require('../models/Product');
const SkinAnalysis = require('../models/SkinAnalysis');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Private Helpers ───────────────────────────────────────────────────
const analyzeImageWithGroq = async (base64Image) => {
    const prompt = `
        Analyze the skin tone in this photo carefully.
        Return ONLY a valid JSON object with this exact structure... (Use your original prompt text here for brevity)
    `;

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.2-90b-vision-preview', // Ensure you use the correct vision model
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                        { type: 'text', text: prompt },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 500,
        });

        const responseText = response.choices[0]?.message?.content?.trim();
        if (!responseText) throw new Error('Empty response from Groq');

        const cleaned = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        if (error.message?.includes('API_KEY') || error.message?.includes('api_key')) {
            throw new AppError('Groq API key is missing or invalid. Check your .env file.', 500);
        }
        throw new AppError('Could not analyze image with AI. Please try again.', 502); // 502 Bad Gateway
    }
};

const groqTextComplete = async (prompt) => {
    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 400,
        });
        const text = response.choices[0]?.message?.content?.trim();
        const cleaned = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        throw new AppError('Failed to generate AI response', 502);
    }
};

// ── Service Methods ───────────────────────────────────────────────────

exports.processNewPhotoAnalysis = async (userId, file) => {
    if (!file) throw new AppError('Please upload a photo', 400);

    const base64 = file.buffer.toString('base64');
    const cloudResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64}`,
        { folder: 'neoshop/skin-analysis', transformation: [{ width: 800, height: 800, crop: 'limit' }] }
    );

    const analysis = await analyzeImageWithGroq(base64);
    const recs = { bestColors: analysis.bestColors || [], avoidColors: analysis.avoidColors || [] };

    const resultData = {
        depthLevel: analysis.depth,
        undertone: analysis.undertone,
        profileKey: analysis.profileKey,
        confidence: analysis.confidence,
        seasonalType: analysis.seasonalType,
        geminiNotes: analysis.geminiNotes,
        recommendedColors: recs.bestColors,
        avoidColors: recs.avoidColors
    };

    await SkinAnalysis.create({
        user: userId,
        photoUrl: cloudResult.secure_url,
        geminiRaw: analysis,
        result: resultData
    });

    await User.findByIdAndUpdate(userId, {
        'styleProfile.skinTone': { ...resultData, analyzedAt: new Date(), photoUrl: cloudResult.secure_url },
        'styleProfile.recommendedColors': recs.bestColors,
        'styleProfile.avoidColors': recs.avoidColors
    });

    return { analysis: { ...analysis, photoUrl: cloudResult.secure_url }, recommendations: recs };
};

exports.processProfilePhotoAnalysis = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.profilePhoto) throw new AppError('No profile photo found. Please upload one first.', 400);

    const imageResponse = await axios.get(user.profilePhoto, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data).toString('base64');

    const analysis = await analyzeImageWithGroq(base64Image);
    const recs = { bestColors: analysis.bestColors || [], avoidColors: analysis.avoidColors || [] };

    // ... (Use the exact same DB update logic as processNewPhotoAnalysis for SkinAnalysis and User)
    // To keep this snippet short, imagine the DB save code here is identical to above, just using user.profilePhoto

    return { analysis: { ...analysis, photoUrl: user.profilePhoto }, recommendations: recs };
};

exports.getOutfitProducts = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.styleProfile?.skinTone?.profileKey) throw new AppError('Please analyse your skin tone first.', 400);

    const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
    const outfit = {};
    const recommendedColors = user.styleProfile.recommendedColors || [];

    for (const category of categories) {
        let products = [];
        if (recommendedColors.length > 0) {
            products = await Product.find({
                category, inStock: true,
                $or: recommendedColors.map(color => ({
                    $or: [
                        { 'colorData.name': { $regex: color, $options: 'i' } },
                        { colors: { $regex: color, $options: 'i' } },
                        { 'colorData.colorFamily': { $regex: color, $options: 'i' } }
                    ]
                }))
            }).limit(3);
        }
        if (products.length === 0) {
            products = await Product.find({ category, inStock: true }).limit(3);
        }
        outfit[category] = products;
    }

    return { profileKey: user.styleProfile.skinTone.profileKey, recommendedColors: recommendedColors.slice(0, 5), outfit };
};

exports.getOutfitSuggestion = async (userId, occasion) => {
    const user = await User.findById(userId);
    const profileKey = user?.styleProfile?.skinTone?.profileKey;
    if (!profileKey) throw new AppError('Please analyse your skin tone first', 400);

    const prompt = `For someone with skin tone profile "${profileKey}" and occasion "${occasion || 'daily_casual'}", suggest a complete outfit. Return ONLY a valid JSON object...`;
    return await groqTextComplete(prompt);
};

exports.getPersonalizedProducts = async (userId, occasion, page = 1, limit = 20) => {
    const user = await User.findById(userId);
    const skinTone = user?.styleProfile?.skinTone;
    const recommendedColors = user?.styleProfile?.recommendedColors || [];

    if (!skinTone?.profileKey) {
        const products = await Product.find({ inStock: true }).skip((page - 1) * limit).limit(Number(limit));
        return { products, personalized: false };
    }

    let query = { inStock: true };
    if (occasion) query.occasion = { $in: [occasion] };
    if (recommendedColors.length > 0) {
        query.$or = recommendedColors.map(color => ({
            $or: [
                { 'colorData.name': { $regex: color, $options: 'i' } },
                { colors: { $regex: color, $options: 'i' } },
                { 'colorData.colorFamily': { $regex: color, $options: 'i' } }
            ]
        }));
    }

    const products = await Product.find(query).skip((page - 1) * limit).limit(Number(limit));
    const total = await Product.countDocuments(query);

    return {
        products, personalized: true, profileKey: skinTone.profileKey, recommendedColors,
        total, page: Number(page), pages: Math.ceil(total / limit)
    };
};

exports.getAnalysisHistory = async (userId) => {
    return await SkinAnalysis.find({ user: userId }).sort({ analyzedAt: -1 }).limit(5).select('-geminiRaw');
};

exports.submitFeedback = async (analysisId, helpful, comment) => {
    await SkinAnalysis.findByIdAndUpdate(analysisId, { userFeedback: { helpful, comment } });
};