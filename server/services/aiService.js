// server/services/aiService.js
const axios = require('axios');
const Groq = require('groq-sdk');
const User = require('../models/User');
const Product = require('../models/Product');
const SkinAnalysis = require('../models/SkinAnalysis');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── FIXED: Complete, specific prompt so Groq returns exact fields needed ──
const SKIN_ANALYSIS_PROMPT = `
You are an expert in South Asian / Indian skin tone analysis for fashion.

Analyze the skin tone in this photo carefully.

Return ONLY a valid JSON object with EXACTLY this structure — no markdown, no explanation, just the JSON:

{
  "depth": "<one of: very_fair | fair | wheatish_light | wheatish_medium | dusky | deep>",
  "undertone": "<one of: warm | cool | olive>",
  "profileKey": "<depth + underscore + undertone, e.g. wheatish_medium_warm>",
  "confidence": <integer 0-100>,
  "seasonalType": "<one of: spring | summer | autumn | winter | neutral>",
  "geminiNotes": "<one sentence describing this specific skin tone>",
  "bestColors": ["Color1", "Color2", "Color3", "Color4", "Color5", "Color6", "Color7", "Color8"],
  "avoidColors": ["Color1", "Color2", "Color3", "Color4"]
}

Depth guidelines for Indian skin:
- very_fair: Lightest Indian tone (Kashmir, Punjab)
- fair: Light with warmth (North India)
- wheatish_light: Light golden wheat (UP, Rajasthan)
- wheatish_medium: Most common Indian tone (Pan-India)
- dusky: Deeper tone (South India, Bengal)
- deep: Richest tone (Tamil Nadu, Kerala)

Undertone guidelines:
- warm: golden/yellow undertones
- cool: pink/red undertones
- olive: greenish/muted undertones (very common in South Indians — never misclassify olive as cool)

For bestColors — suggest Indian fashion colors like: Mustard, Terracotta, Coral, Rust, Olive Green,
Navy, Emerald, Saffron, Peacock Blue, Burgundy, Teal, Maroon, Royal Blue, Gold, Forest Green etc.

For avoidColors — colors that clash with this specific skin tone.

IMPORTANT: The profileKey must exactly match depth_undertone format (e.g. "wheatish_medium_warm", "dusky_olive", "fair_cool").
`;

// ── Private: Call Groq vision model ──────────────────────────────────
const analyzeImageWithGroq = async (base64Image) => {
    try {
        const response = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                        },
                        {
                            type: 'text',
                            text: SKIN_ANALYSIS_PROMPT
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 600,
        });

        const responseText = response.choices[0]?.message?.content?.trim();
        if (!responseText) throw new Error('Empty response from Groq');

        // Strip markdown code fences if present
        const cleaned = responseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate required fields exist
        const required = ['depth', 'undertone', 'profileKey', 'confidence', 'bestColors', 'avoidColors'];
        for (const field of required) {
            if (!(field in parsed)) {
                throw new Error(`Groq response missing required field: ${field}`);
            }
        }

        // Ensure arrays are arrays
        if (!Array.isArray(parsed.bestColors)) parsed.bestColors = [];
        if (!Array.isArray(parsed.avoidColors)) parsed.avoidColors = [];

        // Auto-build profileKey if Groq got it wrong
        if (!parsed.profileKey || !parsed.profileKey.includes('_')) {
            parsed.profileKey = `${parsed.depth}_${parsed.undertone}`;
        }

        return parsed;

    } catch (error) {
        console.error('Groq vision error:', error.message);
        if (error.message?.includes('API_KEY') || error.message?.includes('api_key')) {
            throw new AppError('Groq API key is missing or invalid. Check your .env file.', 500);
        }
        if (error instanceof SyntaxError) {
            throw new AppError('AI returned an unexpected response format. Please try again.', 502);
        }
        throw new AppError('Could not analyze image with AI. Please try again.', 502);
    }
};

// ── Private: Save analysis results to DB ─────────────────────────────
// FIXED: This was missing from processProfilePhotoAnalysis — now extracted
// as a shared helper so both upload and profile-photo flows save correctly
const saveAnalysisToDb = async (userId, photoUrl, analysis, recs) => {
    const resultData = {
        depthLevel: analysis.depth,
        undertone: analysis.undertone,
        profileKey: analysis.profileKey,
        confidence: analysis.confidence,
        seasonalType: analysis.seasonalType || 'neutral',
        geminiNotes: analysis.geminiNotes || '',
        recommendedColors: recs.bestColors,
        avoidColors: recs.avoidColors
    };

    // Save to SkinAnalysis collection (history)
    await SkinAnalysis.create({
        user: userId,
        photoUrl,
        geminiRaw: analysis,
        result: resultData,
        analyzedAt: new Date()
    });

    // Update user's live styleProfile
    await User.findByIdAndUpdate(userId, {
        'styleProfile.skinTone': {
            ...resultData,
            analyzedAt: new Date(),
            photoUrl
        },
        'styleProfile.recommendedColors': recs.bestColors,
        'styleProfile.avoidColors': recs.avoidColors
    });
};

// ── Service Methods ───────────────────────────────────────────────────

// Analyze from a freshly uploaded photo
exports.processNewPhotoAnalysis = async (userId, file) => {
    if (!file) throw new AppError('Please upload a photo', 400);

    const base64 = file.buffer.toString('base64');

    // Upload to Cloudinary first
    const cloudResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64}`,
        {
            folder: 'neoshop/skin-analysis',
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
        }
    );

    // Analyze with Groq
    const analysis = await analyzeImageWithGroq(base64);
    const recs = {
        bestColors: analysis.bestColors || [],
        avoidColors: analysis.avoidColors || []
    };

    // FIXED: Save everything to DB
    await saveAnalysisToDb(userId, cloudResult.secure_url, analysis, recs);

    return {
        analysis: { ...analysis, photoUrl: cloudResult.secure_url },
        recommendations: recs
    };
};

// FIXED: Analyze using the user's existing profile photo
// Previously this had a comment instead of actual DB save code
exports.processProfilePhotoAnalysis = async (userId) => {
    const user = await User.findById(userId);

    if (!user?.profilePhoto) {
        throw new AppError('No profile photo found. Please upload one on your Profile page first.', 400);
    }

    // Fetch the profile photo as a buffer
    const imageResponse = await axios.get(user.profilePhoto, {
        responseType: 'arraybuffer'
    });
    const base64Image = Buffer.from(imageResponse.data).toString('base64');

    // Analyze with Groq
    const analysis = await analyzeImageWithGroq(base64Image);
    const recs = {
        bestColors: analysis.bestColors || [],
        avoidColors: analysis.avoidColors || []
    };

    // FIXED: Actually save to DB (this was completely missing before)
    await saveAnalysisToDb(userId, user.profilePhoto, analysis, recs);

    return {
        analysis: { ...analysis, photoUrl: user.profilePhoto },
        recommendations: recs
    };
};

// Get real products from DB grouped as outfit categories
exports.getOutfitProducts = async (userId) => {
    const user = await User.findById(userId);

    if (!user?.styleProfile?.skinTone?.profileKey) {
        throw new AppError('Please analyse your skin tone first.', 400);
    }

    const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
    const outfit = {};
    const recommendedColors = user.styleProfile.recommendedColors || [];

    for (const category of categories) {
        let products = [];

        // Try color-matched products first
        if (recommendedColors.length > 0) {
            products = await Product.find({
                category,
                inStock: true,
                $or: recommendedColors.map(color => ({
                    $or: [
                        { 'colorData.name': { $regex: color, $options: 'i' } },
                        { colors: { $regex: color, $options: 'i' } },
                        { 'colorData.colorFamily': { $regex: color, $options: 'i' } }
                    ]
                }))
            }).limit(3);
        }

        // Fallback: any available product in this category
        if (products.length === 0) {
            products = await Product.find({
                category,
                inStock: true
            }).limit(3);
        }

        outfit[category] = products;
    }

    return {
        profileKey: user.styleProfile.skinTone.profileKey,
        recommendedColors: recommendedColors.slice(0, 5),
        outfit
    };
};

// Get occasion-specific outfit advice from Groq text model
exports.getOutfitSuggestion = async (userId, occasion) => {
    const user = await User.findById(userId);
    const profileKey = user?.styleProfile?.skinTone?.profileKey;

    if (!profileKey) throw new AppError('Please analyse your skin tone first', 400);

    const occLabel = occasion || 'daily_casual';

    const prompt = `
You are an Indian fashion advisor.

For a person with Indian skin tone profile "${profileKey}" attending a "${occLabel}" occasion,
suggest a complete outfit.

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "occasion": "${occLabel}",
  "topColor": "<specific color name>",
  "topStyle": "<e.g. cotton kurta, casual shirt, formal shirt>",
  "bottomColor": "<specific color name>",
  "bottomStyle": "<e.g. slim trousers, chinos, jeans>",
  "shoeColor": "<specific color name>",
  "shoeStyle": "<e.g. leather loafers, white sneakers, ethnic juttis>",
  "accessoryTip": "<one short tip about accessories or jewellery>",
  "fabricTip": "<one short tip about fabric choice for this occasion>",
  "personalTip": "<one sentence of specific advice for this skin tone + occasion combo>"
}
    `;

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
        console.error('Outfit suggestion error:', error.message);
        throw new AppError('Failed to generate outfit suggestion', 502);
    }
};

// Get personalized product listing (for /products page)
exports.getPersonalizedProducts = async (userId, occasion, page = 1, limit = 20) => {
    const user = await User.findById(userId);
    const skinTone = user?.styleProfile?.skinTone;
    const recommendedColors = user?.styleProfile?.recommendedColors || [];

    // No profile yet — return all products unpersonalized
    if (!skinTone?.profileKey) {
        const products = await Product.find({ inStock: true })
            .skip((page - 1) * limit)
            .limit(Number(limit));
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

    const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return {
        products,
        personalized: true,
        profileKey: skinTone.profileKey,
        recommendedColors,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
    };
};

// Get last 5 analyses for this user
exports.getAnalysisHistory = async (userId) => {
    return await SkinAnalysis.find({ user: userId })
        .sort({ analyzedAt: -1 })
        .limit(5)
        .select('-geminiRaw');
};

// Save user feedback on an analysis
exports.submitFeedback = async (analysisId, helpful, comment) => {
    await SkinAnalysis.findByIdAndUpdate(analysisId, {
        userFeedback: { helpful, comment }
    });
};