// server/controllers/wishlistController.js
const wishlistService = require('../services/wishlistService');
const catchAsync = require('../utils/catchAsync');

// Get user wishlist
exports.getWishlist = catchAsync(async (req, res) => {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.json(wishlist);
});

// Add product to wishlist
exports.addToWishlist = catchAsync(async (req, res) => {
    const wishlist = await wishlistService.addToWishlist(req.user.id, req.body.productId);
    res.json(wishlist);
});

// Remove product from wishlist
exports.removeFromWishlist = catchAsync(async (req, res) => {
    const wishlist = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    res.json(wishlist);
});

// Check if product is in wishlist
exports.checkWishlist = catchAsync(async (req, res) => {
    const result = await wishlistService.checkWishlist(req.user.id, req.params.productId);
    res.json(result);
});

// Clear entire wishlist
exports.clearWishlist = catchAsync(async (req, res) => {
    const result = await wishlistService.clearWishlist(req.user.id);
    res.json(result);
});

// Move product from wishlist to cart
exports.moveToCart = catchAsync(async (req, res) => {
    const cart = await wishlistService.moveToCart(req.user.id, req.body.productId);
    res.json({ message: 'Product moved to cart', cart });
});