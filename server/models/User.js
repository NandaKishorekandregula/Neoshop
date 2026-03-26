const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    styleProfile: {

        skinTone: {
            // 6 depth levels — covers full range of Indian skin
            depthLevel: {
                type: String,
                enum: [
                    'very_fair',       // Kashmir, Punjab
                    'fair',            // North India
                    'wheatish_light',  // UP, Rajasthan
                    'wheatish_medium', // Most common across India
                    'dusky',           // South India, Bengal
                    'deep'             // Tamil Nadu, Kerala
                ]
            },

            // 3 undertones — now includes olive (critical for South Indians)
            undertone: {
                type: String,
                enum: ['warm', 'cool', 'olive']
            },

            // Combined key used for all lookups — e.g. 'wheatish_medium_warm'
            profileKey: { type: String },

            confidence: { type: Number, min: 0, max: 100 },
            seasonalType: { type: String, enum: ['spring', 'summer', 'autumn', 'winter', 'neutral'] },
            geminiNotes: { type: String },  // What Gemini observed about this person
            analyzedAt: { type: Date },
            photoUrl: { type: String }
        },

        // Fix 4: Value contrast between skin and hair
        // Professional stylists use this to recommend outfit combinations
        contrastProfile: {
            level: {
                type: String,
                enum: ['high', 'medium', 'low']
                // high  = stark difference (wheatish skin + black hair)
                // medium = moderate difference
                // low   = close in lightness (deep skin + black hair)
            },
            skinLightness: { type: Number }, // L* value 0-100 in CIELAB
            hairLightness: { type: Number }, // L* value 0-100 in CIELAB
            lightnessGap: { type: Number }, // Difference between the two
            hairColorCategory: {
                type: String,
                enum: ['black', 'dark_brown', 'medium_brown', 'light_brown', 'gray', 'blonde', 'other']
            }
        },

        recommendedColors: [String],  // Best colors for this profile
        avoidColors: [String],  // Colors to avoid
        favoriteColors: [String],  // User manually selected
        preferredStyle: {
            type: String,
            enum: ['casual', 'formal', 'traditional', 'fusion', 'streetwear']
        },
        occasionPreferences: [{
            type: String,
            enum: ['daily_casual', 'office', 'wedding', 'festive', 'party', 'traditional']
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


userSchema.index({ role: 1 });

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);