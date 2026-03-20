const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Get user wishlist
exports.getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id })
            .populate('products');

        if (!wishlist) {
            return res.json({ products: [] });
        }

        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user.id, products: [] });
        }

        // Check if product already in wishlist
        const alreadyInWishlist = wishlist.products.some(
            (id) => id.toString() === productId
        );

        if (alreadyInWishlist) {
            return res.status(400).json({ error: 'Product already in wishlist' });
        }

        // Add product
        wishlist.products.push(productId);
        wishlist.updatedAt = Date.now();
        await wishlist.save();
        await wishlist.populate('products');

        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        // Check if product is in wishlist
        const productExists = wishlist.products.some(
            (id) => id.toString() === productId
        );

        if (!productExists) {
            return res.status(404).json({ error: 'Product not found in wishlist' });
        }

        // Remove product
        wishlist.products.pull(productId);
        wishlist.updatedAt = Date.now();
        await wishlist.save();
        await wishlist.populate('products');

        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.json({ isInWishlist: false });
        }

        const isInWishlist = wishlist.products.some(
            (id) => id.toString() === productId
        );

        res.json({ isInWishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.products = [];
        wishlist.updatedAt = Date.now();
        await wishlist.save();

        res.json({ message: 'Wishlist cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Move product from wishlist to cart
exports.moveToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const Cart = require('../models/Cart');

        // Check product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove from wishlist
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.products.pull(productId);
        wishlist.updatedAt = Date.now();
        await wishlist.save();

        // Add to cart
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += 1;
        } else {
            cart.items.push({ product: productId, quantity: 1 });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        await cart.populate('items.product');

        res.json({ message: 'Product moved to cart', cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};