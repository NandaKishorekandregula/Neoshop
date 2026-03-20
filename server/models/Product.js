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
        rgb: {
            r: Number,
            g: Number,
            b: Number
        },
        colorFamily: {
            type: String,
            enum: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'brown']
        }
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