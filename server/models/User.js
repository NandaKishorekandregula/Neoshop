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
            undertone: {
                type: String,
                enum: ['warm', 'cool', 'neutral']
            },
            confidence: Number,
            seasonalType: String,
            analyzedAt: Date,
            photoUrl: String
        },
        favoriteColors: [String],
        preferredStyle: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);