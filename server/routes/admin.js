const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesAnalytics,
    getTopProducts
} = require('../controllers/adminController');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, isAdmin } = require('../middleware/auth');


router.get('/dashboard', auth, isAdmin, getDashboardStats);

router.get('/analytics/sales', auth, isAdmin, getSalesAnalytics);

router.get('/analytics/top-products', auth, isAdmin, getTopProducts);


router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;

        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            page: Number(page),
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private/Admin
router.get('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be user or admin' });
        }

        // Prevent admin from changing their own role
        if (req.params.id === req.user.id.toString()) {
            return res.status(400).json({ error: 'You cannot change your own role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (req.params.id === req.user.id.toString()) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/products', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category } = req.query;

        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        // Low stock products (inventory < 10)
        const lowStock = await Product.find({ inventory: { $lt: 10 }, inStock: true });

        res.json({
            products,
            page: Number(page),
            pages: Math.ceil(total / limit),
            total,
            lowStockCount: lowStock.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.put('/products/:id/inventory', auth, isAdmin, async (req, res) => {
    try {
        const { inventory } = req.body;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                inventory,
                inStock: inventory > 0
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/orders', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name images price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            page: Number(page),
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/orders/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = status;

        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;