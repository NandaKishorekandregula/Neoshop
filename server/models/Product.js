const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses']
    },
    images: {
        type: [String],
        required: true
    },
    model3D: {
        type: String,
        default: ''
    },
    colorData: {
        name: String,
        hex: String,
        rgb: { r: Number, g: Number, b: Number },

        // Expanded — includes Indian-specific color families
        colorFamily: {
            type: String,
            enum: [
                'red', 'blue', 'green', 'yellow', 'orange', 'purple',
                'pink', 'black', 'white', 'gray', 'brown',
                'olive',    // Indian kurtas, salwars
                'maroon',   // Wedding, festive staple
                'teal',     // Indian fusion wear
                'coral',    // Summer Indian fashion
                'mustard',  // Warm skin tone essential
                'navy',     // Formal menswear
                'beige'     // Neutral for Indian tones
            ]
        },

        // Which Indian profile keys this product suits
        // e.g. ['wheatish_medium_warm', 'dusky_olive']
        suitableFor: [{ type: String }],

        // Which occasions this color works for
        occasionSuitability: [{
            type: String,
            enum: ['daily_casual', 'office', 'wedding', 'festive', 'party', 'traditional']
        }],

        // Indian climate seasons
        seasonSuitability: [{
            type: String,
            enum: ['summer', 'monsoon', 'winter', 'all_season']
        }]
    },
    sizes: [String],
    colors: [String],
    inStock: {
        type: Boolean,
        default: true
    },
    inventory: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);