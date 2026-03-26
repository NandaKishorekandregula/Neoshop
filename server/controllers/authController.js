// server/controllers/authController.js
const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync'); // 🆕 Import the catcher

// Register
exports.register = catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    const { user, token } = await authService.registerUser(name, email, password);

    res.status(201).json({
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto || '',
            createdAt: user.createdAt,
        }
    });
});

// Login
exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await authService.loginUser(email, password);

    res.json({
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto || '',
            createdAt: user.createdAt,
        }
    });
});

// Get current user
exports.getMe = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
});