require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const errorHandler = require('./middleware/errorHandler');
// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// product routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

//upload routes
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

//cart routes
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

//wishlist routes
const wishlistRoutes = require('./routes/wishlist');
app.use('/api/wishlist', wishlistRoutes);

//order routes
const ordertRoutes = require('./routes/order');
app.use('/api/orders', ordertRoutes);

//admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

//ai routes
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to NeoShop API' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT} `);
});