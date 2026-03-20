const express = require('express');
const router = express.Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    clearWishlist,
    moveToCart
} = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getWishlist);
router.post('/', auth, addToWishlist);
router.delete('/:productId', auth, removeFromWishlist);
router.get('/check/:productId', auth, checkWishlist);
router.delete('/', auth, clearWishlist);
router.post('/move-to-cart', auth, moveToCart);

module.exports = router;