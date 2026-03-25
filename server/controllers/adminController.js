const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();

        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue: totalRevenue[0]?.total || 0,
            ordersByStatus,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Sales analytics
exports.getSalesAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const salesByDay = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json(salesByDay);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Top selling products
exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Populate product details
        await Product.populate(topProducts, { path: '_id' });

        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};