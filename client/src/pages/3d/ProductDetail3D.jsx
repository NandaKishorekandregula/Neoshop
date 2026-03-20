import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Loading from '../../../components/2d/common/Loading';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetail3D() {
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

    if (loading) return (
        <div className="w-full min-h-screen bg-[#F8F9FE] pt-40 flex justify-center">
            <Loading />
        </div>
    );

    if (!product) return (
        <div className="w-full min-h-screen bg-[#F8F9FE] pt-40 flex items-start justify-center">
            <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[40px] px-20 border border-white">
                <span className="text-6xl block mb-4">👻</span>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Product Vanished</h3>
                <p className="text-gray-500">We couldn't find the product you're looking for.</p>
                <button onClick={() => navigate('/products')} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-full font-bold">Back to Catalog</button>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-[#F8F9FE] relative overflow-hidden pt-32 pb-20">

            {/* BACKGROUND STUDIO LIGHTS */}
            <div className="absolute top-0 left-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Back Button */}
                <button onClick={() => navigate('/products')} className="mb-8 flex items-center text-gray-500 hover:text-purple-600 font-bold tracking-widest text-xs uppercase transition-colors">
                    <span className="mr-2">←</span> Back to Collection
                </button>

                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* --- LEFT COL: THE 3D STAGE --- */}
                    <div className="flex flex-col items-center justify-center relative">

                        {/* Glowing Pedestal Backlight */}
                        <div className="absolute w-80 h-80 bg-gradient-to-tr from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-50"></div>

                        {/* Main Product Display (Floating) */}
                        {/* 🌟 TIP: Once you have a .glb file, replace this <img> with your <Canvas><ShoeModel /></Canvas>! */}
                        <div className="relative w-full h-[500px] flex items-center justify-center mb-8">
                            <img
                                src={product.images[selectedImage]}
                                alt={product.name}
                                className="w-[90%] max-h-full object-contain mix-blend-multiply drop-shadow-[0_40px_40px_rgba(0,0,0,0.2)] animate-smooth-float z-10"
                            />
                        </div>

                        {/* Floating Glass Thumbnails */}
                        <div className="flex gap-4 z-20">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative w-20 h-20 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${selectedImage === index
                                            ? 'bg-white border-2 border-purple-500 shadow-lg scale-110'
                                            : 'bg-white/40 border border-white/60 hover:bg-white/60 hover:scale-105'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply p-2" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- RIGHT COL: GLASSMORPHISM UI PANEL --- */}
                    <div>
                        <div className="bg-white/60 backdrop-blur-2xl p-10 lg:p-14 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white/80">

                            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
                                {product.category}
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm">
                                    <span className="text-yellow-400 text-lg drop-shadow-sm">⭐</span>
                                    <span className="ml-1.5 font-bold text-gray-900">{product.rating || 0}</span>
                                    <span className="ml-2 text-gray-400 text-sm font-medium">({product.numReviews || 0} reviews)</span>
                                </div>
                            </div>

                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-8 drop-shadow-sm">
                                ₹{product.price}
                            </div>

                            <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                                {product.description}
                            </p>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                {/* Color Selection */}
                                {product.colors && product.colors.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Color</label>
                                        <div className="flex flex-wrap gap-3">
                                            {product.colors.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-5 py-2.5 rounded-xl font-bold capitalize transition-all duration-300 ${selectedColor === color
                                                            ? 'bg-gray-900 text-white shadow-lg'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
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
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Size</label>
                                        <div className="flex flex-wrap gap-3">
                                            {product.sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all duration-300 ${selectedSize === size
                                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quantity & Actions Row */}
                            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-200/60">

                                <div className="flex items-center bg-white rounded-2xl shadow-sm p-1 border border-gray-100">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 font-black text-xl transition-colors">
                                        -
                                    </button>
                                    <span className="w-12 text-center font-black text-xl text-gray-900">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 font-black text-xl transition-colors">
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock}
                                    className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 px-8 rounded-2xl font-black tracking-wider shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                                </button>

                                <button className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">❤️</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}