const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const registerValidation = [
    body('name', 'Name is required').not().isEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', auth, getMe);

// ✅ Update profile — name + photo
router.put('/update-profile', auth, async (req, res) => {
    try {
        const { profilePhoto, name } = req.body;

        // Debug logs — check server terminal after uploading
        console.log('update-profile called by user:', req.user.id);
        console.log('name received:', name);
        console.log('profilePhoto received:', profilePhoto);

        // ✅ Use $set explicitly to avoid overwriting other fields
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    name: name,
                    profilePhoto: profilePhoto
                }
            },
            { new: true, runValidators: false }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Debug — confirm what was saved
        console.log('Saved profilePhoto in DB:', updatedUser.profilePhoto);

        res.json(updatedUser);
    } catch (error) {
        console.error('update-profile error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;