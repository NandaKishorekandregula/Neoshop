// server/services/orderService.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.createOrder = async (userId, items, shippingAddress, paymentMethod) => {
    if (!items || items.length === 0) {
        throw new AppError('No items in order', 400);
    }

    // 🆕 SENIOR DEV OPTIMIZATION: Get all products in ONE database trip instead of a loop
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    // Create a quick lookup map for prices { 'productId': 19.99 }
    const priceMap = {};
    products.forEach(p => { priceMap[p._id.toString()] = p.price; });

    let totalAmount = 0;
    for (let item of items) {
        const price = priceMap[item.product.toString()];
        if (price === undefined) {
            throw new AppError(`Product ${item.product} not found or unavailable`, 404);
        }
        totalAmount += price * item.quantity;
    }

    // 1. Create order
    const order = await Order.create({
        user: userId,
        items,
        shippingAddress,
        paymentMethod,
        totalAmount
    });

    // 2. Clear user's cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // 3. Populate product details before returning
    await order.populate('items.product');

    return order;
};

exports.getUserOrders = async (userId) => {
    return await Order.find({ user: userId })
        .populate('items.product')
        .sort({ createdAt: -1 });
};

exports.getOrderById = async (orderId, userId, userRole) => {
    const order = await Order.findById(orderId)
        .populate('items.product')
        .populate('user', 'name email');

    if (!order) throw new AppError('Order not found', 404);

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== userId && userRole !== 'admin') {
        throw new AppError('Access denied', 403);
    }

    return order;
};

exports.updateOrderStatus = async (orderId, status) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    order.status = status;

    if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    }

    await order.save();
    return order;
};

exports.getAllOrders = async () => {
    return await Order.find()
        .populate('user', 'name email')
        .populate('items.product')
        .sort({ createdAt: -1 });
};