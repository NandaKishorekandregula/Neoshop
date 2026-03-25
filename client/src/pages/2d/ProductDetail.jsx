import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Loading from '../../components/2d/common/Loading';
import { useAuth } from '../../context/AuthContext';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await API.get(`/products/${id}`);
            setProduct(response.data);
            if (response.data.sizes?.length > 0) {
                setSelectedSize(response.data.sizes[0]);
            }
            if (response.data.colors?.length > 0) {
                setSelectedColor(response.data.colors[0]);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            await API.post('/cart', {
                productId: product._id,
                quantity,
                size: selectedSize,
                color: selectedColor
            });
            alert('Added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart');
        }
    };

    if (loading) return <Loading />;
    if (!product) return <div className="text-center py-12">Product not found</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-12">
                {/* Images Section */}
                <div>
                    {/* Main Image */}
                    <div className="bg-gray-100 rounded-xl overflow-hidden mb-4">
                        <img
                            src={product.images[selectedImage]}
                            alt={product.name}
                            className="w-full h-96 object-contain"
                        />
                    </div>

                    {/* Thumbnail Images */}
                    <div className="grid grid-cols-4 gap-2">
                        {product.images.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`border-2 rounded-lg overflow-hidden ${selectedImage === index ? 'border-primary' : 'border-gray-300'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-20 object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info Section */}
                <div>
                    <div className="mb-4">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
                            {product.category}
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center">
                            <span className="text-yellow-400 text-xl">⭐</span>
                            <span className="ml-1 text-lg">{product.rating || 0}</span>
                            <span className="ml-2 text-gray-600">({product.numReviews || 0} reviews)</span>
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-primary mb-6">
                        ₹{product.price}
                    </div>

                    <p className="text-gray-700 mb-8 leading-relaxed">
                        {product.description}
                    </p>

                    {/* Color Selection */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="mb-6">
                            <label className="block font-semibold mb-3">Color:</label>
                            <div className="flex gap-2">
                                {product.colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-4 py-2 border-2 rounded-lg capitalize ${selectedColor === color
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-gray-300 hover:border-primary'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Selection */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div className="mb-6">
                            <label className="block font-semibold mb-3">Size:</label>
                            <div className="flex gap-2">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 border-2 rounded-lg ${selectedSize === size
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-gray-300 hover:border-primary'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-8">
                        <label className="block font-semibold mb-3">Quantity:</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-primary"
                            >
                                -
                            </button>
                            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-primary"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.inStock}
                            className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {product.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                        </button>
                        <button className="px-6 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition">
                            ❤️
                        </button>
                    </div>

                    {/* Stock Status */}
                    <div className="border-t pt-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Availability:</span>
                            <span className={product.inStock ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">SKU:</span>
                            <span className="font-semibold">{product._id.slice(-8)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products Section */}
            <div className="mt-20">
                <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
                {/* Will add related products later */}
            </div>
        </div>
    );
}

export default ProductDetail;