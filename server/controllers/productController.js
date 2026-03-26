// server/controllers/productController.js
const productService = require('../services/productService');
const catchAsync = require('../utils/catchAsync');

// Get all products
exports.getProducts = catchAsync(async (req, res) => {
    // Pass the entire query object to the service
    const result = await productService.getProducts(req.query);
    res.json(result);
});

// Get single product
exports.getProduct = catchAsync(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
});

// Create product (admin only)
exports.createProduct = catchAsync(async (req, res) => {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
});

// Update product (admin only)
exports.updateProduct = catchAsync(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
});

// Delete product (admin only)
exports.deleteProduct = catchAsync(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
});