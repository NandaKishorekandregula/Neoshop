// server/services/wishlistService.js
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart'); // 🆕 Moved to the top for clean architecture
const AppError = require('../utils/AppError');

exports.getWishlist = async (userId) => {
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    if (!wishlist) return { products: [] };
    return wishlist;
};

exports.addToWishlist = async (userId, productId) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        wishlist = new Wishlist({ user: userId, products: [] });
    }

    const alreadyInWishlist = wishlist.products.some(id => id.toString() === productId);
    if (alreadyInWishlist) {
        throw new AppError('Product already in wishlist', 400);
    }

    wishlist.products.push(productId);
    wishlist.updatedAt = Date.now();
    await wishlist.save();
    await wishlist.populate('products');

    return wishlist;
};

exports.removeFromWishlist = async (userId, productId) => {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) throw new AppError('Wishlist not found', 404);

    const productExists = wishlist.products.some(id => id.toString() === productId);
    if (!productExists) throw new AppError('Product not found in wishlist', 404);

    wishlist.products.pull(productId);
    wishlist.updatedAt = Date.now();
    await wishlist.save();
    await wishlist.populate('products');

    return wishlist;
};

exports.checkWishlist = async (userId, productId) => {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return { isInWishlist: false };

    const isInWishlist = wishlist.products.some(id => id.toString() === productId);
    return { isInWishlist };
};

exports.clearWishlist = async (userId) => {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) throw new AppError('Wishlist not found', 404);

    wishlist.products = [];
    wishlist.updatedAt = Date.now();
    await wishlist.save();

    return { message: 'Wishlist cleared' };
};

exports.moveToCart = async (userId, productId) => {
    // 1. Verify Product
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    // 2. Remove from Wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) throw new AppError('Wishlist not found', 404);

    wishlist.products.pull(productId);
    wishlist.updatedAt = Date.now();
    await wishlist.save();

    // 3. Add to Cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += 1;
    } else {
        cart.items.push({ product: productId, quantity: 1 });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');

    return cart;
};