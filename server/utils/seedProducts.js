const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
    {
        name: 'Light Blue Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt perfect for casual wear',
        price: 29.99,
        category: 'tops',
        images: ['https://via.placeholder.com/400'],
        colorData: {
            name: 'Light Blue',
            hex: '#87CEEB',
            rgb: { r: 135, g: 206, b: 235 },
            colorFamily: 'blue'
        },
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['light blue', 'white', 'black'],
        inStock: true,
        inventory: 50
    },
    {
        name: 'Dark Wash Denim Jeans',
        description: 'Classic dark wash jeans with slim fit',
        price: 49.99,
        category: 'bottoms',
        images: ['https://via.placeholder.com/400'],
        colorData: {
            name: 'Dark Blue',
            hex: '#00008B',
            rgb: { r: 0, g: 0, b: 139 },
            colorFamily: 'blue'
        },
        sizes: ['28', '30', '32', '34', '36'],
        colors: ['dark blue', 'black'],
        inStock: true,
        inventory: 40
    },
    {
        name: 'Brown Leather Boots',
        description: 'Premium leather boots for all occasions',
        price: 120.00,
        category: 'shoes',
        images: ['https://via.placeholder.com/400'],
        colorData: {
            name: 'Brown',
            hex: '#8B4513',
            rgb: { r: 139, g: 69, b: 19 },
            colorFamily: 'brown'
        },
        sizes: ['7', '8', '9', '10', '11'],
        colors: ['brown', 'black'],
        inStock: true,
        inventory: 25
    },
    {
        name: 'White Canvas Sneakers',
        description: 'Classic white sneakers for everyday wear',
        price: 79.99,
        category: 'shoes',
        images: ['https://via.placeholder.com/400'],
        colorData: {
            name: 'White',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            colorFamily: 'white'
        },
        sizes: ['7', '8', '9', '10', '11'],
        colors: ['white', 'black'],
        inStock: true,
        inventory: 60
    },
    {
        name: 'Red Summer Dress',
        description: 'Flowy summer dress perfect for warm weather',
        price: 59.99,
        category: 'dresses',
        images: ['https://via.placeholder.com/400'],
        colorData: {
            name: 'Red',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            colorFamily: 'red'
        },
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['red', 'blue', 'green'],
        inStock: true,
        inventory: 30
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample products
        await Product.insertMany(sampleProducts);
        console.log('✅ Sample products inserted');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedProducts();