const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrder,
    updateOrderStatus,
    getAllOrders
} = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');


router.post('/', auth, createOrder);
router.get('/my-orders', auth, getUserOrders);
router.get('/all', auth, isAdmin, getAllOrders);
router.get('/:id', auth, getOrder);
router.put('/:id/status', auth, isAdmin, updateOrderStatus);
module.exports = router;