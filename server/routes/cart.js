const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/item', auth, updateCartItem);
router.delete('/item/:itemId', auth, removeFromCart);
router.delete('/', auth, clearCart);

module.exports = router;