// server/controllers/cartController.js
const cartService = require('../services/cartService');
const catchAsync = require('../utils/catchAsync');

// Get user cart
exports.getCart = catchAsync(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
});

// Add to cart
exports.addToCart = catchAsync(async (req, res) => {
    const { productId, quantity, size, color } = req.body;

    const cart = await cartService.addToCart(req.user.id, productId, quantity, size, color);

    res.json(cart);
});

// Update cart item
exports.updateCartItem = catchAsync(async (req, res) => {
    const { itemId, quantity } = req.body;

    const cart = await cartService.updateCartItem(req.user.id, itemId, quantity);

    res.json(cart);
});

// Remove from cart
exports.removeFromCart = catchAsync(async (req, res) => {
    // Notice itemId comes from req.params here, not req.body!
    const { itemId } = req.params;

    const cart = await cartService.removeFromCart(req.user.id, itemId);

    res.json(cart);
});

// Clear cart
exports.clearCart = catchAsync(async (req, res) => {
    const result = await cartService.clearCart(req.user.id);
    res.json(result);
});