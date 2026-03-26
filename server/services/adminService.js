// server/services/adminService.js
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

exports.getDashboardStats = async () => {
    // PRO TIP: Promise.all runs all these queries at the exact same time instead of waiting for one to finish before starting the next.
    const [
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenueAgg,
        ordersByStatus,
        recentOrders
    ] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
    ]);

    return {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        ordersByStatus,
        recentOrders
    };
};

exports.getSalesAnalytics = async (period = '30') => {
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

    return salesByDay;
};

exports.getTopProducts = async () => {
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

    return topProducts;
};