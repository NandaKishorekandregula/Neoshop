// server/controllers/orderController.js
const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');

// Create order
exports.createOrder = catchAsync(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;

    const order = await orderService.createOrder(
        req.user.id,
        items,
        shippingAddress,
        paymentMethod
    );

    res.status(201).json(order);
});

// Get user orders
exports.getUserOrders = catchAsync(async (req, res) => {
    const orders = await orderService.getUserOrders(req.user.id);
    res.json(orders);
});

// Get order by ID
exports.getOrder = catchAsync(async (req, res) => {
    // Pass the user's role to the service so it can check authorization!
    const order = await orderService.getOrderById(
        req.params.id,
        req.user.id,
        req.user.role
    );
    res.json(order);
});

// Update order status (admin only)
exports.updateOrderStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json(order);
});

// Get all orders (admin only)
exports.getAllOrders = catchAsync(async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.json(orders);
});