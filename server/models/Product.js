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
    occasion: [{
        type: String,
        enum: ['daily_casual', 'office', 'wedding', 'festive', 'party', 'traditional']
    }],

    // Fabric is critical in Indian fashion — silk for weddings, cotton for daily
    fabric: {
        type: String,
        enum: ['cotton', 'silk', 'linen', 'polyester', 'denim',
            'wool', 'georgette', 'chiffon', 'other']
    },

    season: [{
        type: String,
        enum: ['summer', 'monsoon', 'winter', 'all_season']
    }],
    aiTags: [String],  // e.g. ['ethnic', 'fusion', 'block-print', 'floral']
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

productSchema.index(
    { name: 'text', description: 'text', 'colorData.colorFamily': 'text' },
    { weights: { name: 10, 'colorData.colorFamily': 5, description: 1 } }
);

// 2. Compound Indexes: For common e-commerce filtering and sorting (ESR Rule)
productSchema.index({ category: 1, price: 1 }); // Browsing categories + sorting by price
productSchema.index({ occasion: 1, rating: -1 }); // Finding top-rated items for specific occasions
productSchema.index({ 'colorData.colorFamily': 1, fabric: 1 }); // Filtering by color and fabric

// 3. Multikey Indexes: For array fields (Crucial for your recommendation engine)
productSchema.index({ aiTags: 1 });
productSchema.index({ 'colorData.suitableFor': 1 });

// 4. Partial Index: Saves RAM by only indexing the price of items actually in stock
productSchema.index(
    { price: 1 }, 
    { partialFilterExpression: { inStock: true } }
);

module.exports = mongoose.model('Product', productSchema);