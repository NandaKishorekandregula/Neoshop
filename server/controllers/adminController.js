// server/controllers/adminController.js
const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');

// Dashboard stats
exports.getDashboardStats = catchAsync(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
});

// Sales analytics
exports.getSalesAnalytics = catchAsync(async (req, res) => {
    const { period } = req.query; // defaults to '30' in the service if undefined
    const analytics = await adminService.getSalesAnalytics(period);
    res.json(analytics);
});

// Top selling products
exports.getTopProducts = catchAsync(async (req, res) => {
    const topProducts = await adminService.getTopProducts();
    res.json(topProducts);
});