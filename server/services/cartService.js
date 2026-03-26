// server/services/cartService.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.getCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    // If no cart exists, just return an empty items array
    if (!cart) return { items: [] };

    return cart;
};

exports.addToCart = async (userId, productId, quantity, size, color) => {
    // 1. Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // 2. Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    // 3. Check if exact item (with same size/color) is already in cart
    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId &&
            item.size === size &&
            item.color === color
    );

    if (existingItemIndex > -1) {
        // Update quantity if it exists
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't
        cart.items.push({ product: productId, quantity, size, color });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    // We populate the product data before sending it back so the frontend has the images/prices
    await cart.populate('items.product');

    return cart;
};

exports.updateCartItem = async (userId, itemId, quantity) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = cart.items.id(itemId);
    if (!item) throw new AppError('Item not found in cart', 404);

    if (quantity <= 0) {
        // 🆕 SENIOR DEV FIX: .pull() is the modern, safe way to remove from a Mongoose array
        cart.items.pull(itemId);
    } else {
        item.quantity = quantity;
    }

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');

    return cart;
};

exports.removeFromCart = async (userId, itemId) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', 404);

    cart.items.pull(itemId);
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');

    return cart;
};

exports.clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', 404);

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    return { message: 'Cart cleared' };
};