const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator'); // 1. Import validator
const { register, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// 2. Define Validation Rules for Register
const registerValidation = [
    body('name', 'Name is required').not().isEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// 3. Define Validation Rules for Login
const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
];

// 4. Create a middleware function to catch and show errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// 5. Add validation to your routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', auth, getMe);

module.exports = router;