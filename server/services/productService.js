// server/services/productService.js
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

exports.getProducts = async (queryParams) => {
    const {
        search,
        category,
        minPrice,
        maxPrice,
        color,
        sort,
        page = 1,
        limit = 20
    } = queryParams;

    // 1. Build query
    let query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (category) query.category = category;

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (color) query.colors = color;

    // 2. Sorting
    let sortOption = {};
    if (sort === 'price-asc') sortOption.price = 1;
    else if (sort === 'price-desc') sortOption.price = -1;
    else if (sort === 'name') sortOption.name = 1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else sortOption.createdAt = -1; // default

    // 3. Pagination
    const skip = (page - 1) * limit;

    // 🆕 SENIOR DEV OPTIMIZATION: Run the search and the count at the exact same time!
    const [products, total] = await Promise.all([
        Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit)),
        Product.countDocuments(query)
    ]);

    return {
        products,
        page: Number(page),
        pages: Math.ceil(total / limit),
        total
    };
};

exports.getProductById = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    return product;
};

exports.createProduct = async (productData) => {
    return await Product.create(productData);
};

exports.updateProduct = async (productId, updateData) => {
    const product = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!product) throw new AppError('Product not found', 404);
    return product;
};

exports.deleteProduct = async (productId) => {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) throw new AppError('Product not found', 404);
    return { message: 'Product deleted successfully' };
};