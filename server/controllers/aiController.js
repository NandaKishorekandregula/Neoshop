const axios = require('axios');
const Groq = require('groq-sdk');
const User = require('../models/User');
const Product = require('../models/Product');
const SkinAnalysis = require('../models/SkinAnalysis');
const cloudinary = require('../config/cloudinary');

// ── Groq client ───────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Helper: analyze image with Groq Vision ────────────────────────────
const analyzeImageWithGroq = async (base64Image) => {
    const prompt = `
        Analyze the skin tone in this photo carefully.
        
        Return ONLY a valid JSON object with this exact structure, no extra text:
        {
            "depth": "fair" or "light" or "medium" or "tan" or "deep",
            "undertone": "warm" or "cool" or "neutral",
            "profileKey": one of these exact values: "fair_warm", "fair_cool", "fair_neutral", "light_warm", "light_cool", "light_neutral", "medium_warm", "medium_cool", "medium_neutral", "tan_warm", "tan_cool", "tan_neutral", "deep_warm", "deep_cool", "deep_neutral",
            "confidence": a number between 0.0 and 1.0,
            "seasonalType": "Spring" or "Summer" or "Autumn" or "Winter",
            "geminiNotes": "a brief 1-2 sentence description of the skin tone",
            "bestColors": ["color1", "color2", "color3", "color4", "color5"],
            "avoidColors": ["color1", "color2", "color3"]
        }
        
        Guidelines for Indian skin tones:
        - fair/light + warm undertone → bestColors: navy blue, cream, olive green, burgundy, forest green
        - fair/light + cool undertone → bestColors: lavender, rose pink, sky blue, grey, silver
        - medium/tan + warm undertone → bestColors: orange, yellow, coral, bright white, royal blue
        - medium/tan + cool undertone → bestColors: purple, hot pink, teal, charcoal grey, black
        - deep + warm undertone → bestColors: bright white, electric blue, fire red, gold, lime green
        - deep + cool undertone → bestColors: emerald green, cobalt blue, magenta, silver, pure white
        
        Return ONLY the JSON object. No markdown, no backticks, no explanation.
    `;

    const response = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Groq's free vision model
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`,
                        },
                    },
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ],
        temperature: 0.1, // Low temperature for consistent JSON output
        max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content?.trim();
    if (!responseText) throw new Error('Empty response from Groq');

    // Clean any markdown formatting if present
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
};

// ── Helper: text-only Groq call (for outfit suggestions) ─────────────
const groqTextComplete = async (prompt) => {
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Fast text model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
    });
    const text = response.choices[0]?.message?.content?.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
};

// ── Analyze from uploaded photo ───────────────────────────────────────
exports.analyzeSkinTone = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a photo' });
        }

        // Upload to Cloudinary
        const base64 = req.file.buffer.toString('base64');
        const cloudResult = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${base64}`,
            {
                folder: 'neoshop/skin-analysis',
                transformation: [{ width: 800, height: 800, crop: 'limit' }]
            }
        );

        // Analyze with Groq
        let analysis;
        try {
            analysis = await analyzeImageWithGroq(base64);
        } catch (groqErr) {
            console.error('Groq error:', groqErr.message);
            return res.status(500).json({
                error: 'Could not analyze image. Please try again.'
            });
        }

        const recs = {
            bestColors: analysis.bestColors || [],
            avoidColors: analysis.avoidColors || []
        };

        // Save to MongoDB
        await SkinAnalysis.create({
            user: req.user.id,
            photoUrl: cloudResult.secure_url,
            geminiRaw: analysis,
            result: {
                depthLevel: analysis.depth,
                undertone: analysis.undertone,
                profileKey: analysis.profileKey,
                confidence: analysis.confidence,
                seasonalType: analysis.seasonalType,
                geminiNotes: analysis.geminiNotes,
                recommendedColors: recs.bestColors,
                avoidColors: recs.avoidColors
            }
        });

        // Update user style profile
        await User.findByIdAndUpdate(req.user.id, {
            'styleProfile.skinTone': {
                depthLevel: analysis.depth,
                undertone: analysis.undertone,
                profileKey: analysis.profileKey,
                confidence: analysis.confidence,
                seasonalType: analysis.seasonalType,
                geminiNotes: analysis.geminiNotes,
                analyzedAt: new Date(),
                photoUrl: cloudResult.secure_url
            },
            'styleProfile.recommendedColors': recs.bestColors,
            'styleProfile.avoidColors': recs.avoidColors
        });

        res.json({
            success: true,
            analysis: { ...analysis, photoUrl: cloudResult.secure_url },
            recommendations: recs
        });

    } catch (error) {
        console.error('analyzeSkinTone error:', error.message);
        res.status(500).json({ error: 'Analysis failed: ' + error.message });
    }
};

// ── Analyze using existing profile photo ─────────────────────────────
exports.analyzeFromProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user?.profilePhoto) {
            return res.status(400).json({
                error: 'No profile photo found. Please upload a profile photo first on your Profile page.'
            });
        }

        // Fetch profile photo as base64
        const imageResponse = await axios.get(user.profilePhoto, {
            responseType: 'arraybuffer'
        });
        const base64Image = Buffer.from(imageResponse.data).toString('base64');

        // Analyze with Groq Vision
        let analysis;
        try {
            analysis = await analyzeImageWithGroq(base64Image);
        } catch (groqErr) {
            console.error('Groq parse error:', groqErr.message);
            return res.status(500).json({
                error: 'Could not analyze image. Please try again.'
            });
        }

        const recs = {
            bestColors: analysis.bestColors || [],
            avoidColors: analysis.avoidColors || []
        };

        // Save analysis to MongoDB
        await SkinAnalysis.create({
            user: req.user.id,
            photoUrl: user.profilePhoto,
            geminiRaw: analysis,
            result: {
                depthLevel: analysis.depth,
                undertone: analysis.undertone,
                profileKey: analysis.profileKey,
                confidence: analysis.confidence,
                seasonalType: analysis.seasonalType,
                geminiNotes: analysis.geminiNotes,
                recommendedColors: recs.bestColors,
                avoidColors: recs.avoidColors
            }
        });

        // Update user style profile in MongoDB
        await User.findByIdAndUpdate(req.user.id, {
            'styleProfile.skinTone': {
                depthLevel: analysis.depth,
                undertone: analysis.undertone,
                profileKey: analysis.profileKey,
                confidence: analysis.confidence,
                seasonalType: analysis.seasonalType,
                geminiNotes: analysis.geminiNotes,
                analyzedAt: new Date(),
                photoUrl: user.profilePhoto
            },
            'styleProfile.recommendedColors': recs.bestColors,
            'styleProfile.avoidColors': recs.avoidColors
        });

        res.json({
            success: true,
            analysis: { ...analysis, photoUrl: user.profilePhoto },
            recommendations: recs
        });

    } catch (error) {
        console.error('analyzeFromProfile error:', error.message);

        if (error.message?.includes('API_KEY') || error.message?.includes('api_key')) {
            return res.status(500).json({
                error: 'Groq API key is missing or invalid. Check your .env file.'
            });
        }

        res.status(500).json({
            error: 'Analysis failed: ' + error.message
        });
    }
};

// ── Get real product recommendations grouped by outfit category ───────
exports.getOutfitProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const profileKey = user?.styleProfile?.skinTone?.profileKey;
        const recommendedColors = user?.styleProfile?.recommendedColors || [];

        if (!profileKey) {
            return res.status(400).json({
                error: 'Please analyse your skin tone first.'
            });
        }

        const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
        const outfit = {};

        for (const category of categories) {
            let products = [];

            // Try to find products matching recommended colors
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

        res.json({
            success: true,
            profileKey,
            recommendedColors: recommendedColors.slice(0, 5),
            outfit
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Get outfit suggestion by occasion ────────────────────────────────
exports.getOutfitSuggestion = async (req, res) => {
    try {
        const { occasion } = req.body;
        const user = await User.findById(req.user.id);
        const profileKey = user?.styleProfile?.skinTone?.profileKey;

        if (!profileKey) {
            return res.status(400).json({
                error: 'Please analyse your skin tone first'
            });
        }

        const prompt = `
            For someone with skin tone profile "${profileKey}" and occasion "${occasion || 'daily_casual'}",
            suggest a complete outfit.
            
            Return ONLY a valid JSON object:
            {
                "top": "description of top",
                "bottom": "description of bottom",
                "shoes": "description of shoes",
                "accessory": "description of accessory",
                "colors": ["color1", "color2", "color3"],
                "tip": "one styling tip"
            }
            
            Return only JSON, no markdown, no backticks.
        `;

        const outfit = await groqTextComplete(prompt);
        res.json({ success: true, outfit });

    } catch (error) {
        console.error('getOutfitSuggestion error:', error.message);
        res.status(500).json({ error: 'Could not generate outfit suggestion' });
    }
};

// ── Get personalized products listing ────────────────────────────────
exports.getPersonalizedProducts = async (req, res) => {
    try {
        const { occasion, page = 1, limit = 20 } = req.query;
        const user = await User.findById(req.user.id);
        const skinTone = user?.styleProfile?.skinTone;
        const recommendedColors = user?.styleProfile?.recommendedColors || [];

        // If no skin analysis done yet, return all products
        if (!skinTone?.profileKey) {
            const products = await Product.find({ inStock: true })
                .skip((page - 1) * limit)
                .limit(Number(limit));
            return res.json({ products, personalized: false });
        }

        let query = { inStock: true };
        if (occasion) query.occasion = { $in: [occasion] };

        // Filter by recommended colors
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

        res.json({
            products,
            personalized: true,
            profileKey: skinTone.profileKey,
            recommendedColors,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Analysis history ──────────────────────────────────────────────────
exports.getAnalysisHistory = async (req, res) => {
    try {
        const history = await SkinAnalysis.find({ user: req.user.id })
            .sort({ analyzedAt: -1 })
            .limit(5)
            .select('-geminiRaw');

        res.json({ success: true, history });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── User feedback ─────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
    try {
        const { analysisId, helpful, comment } = req.body;

        await SkinAnalysis.findByIdAndUpdate(analysisId, {
            userFeedback: { helpful, comment }
        });

        res.json({ success: true, message: 'Feedback saved. Thank you!' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};