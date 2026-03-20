import React, { Suspense, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Billboard, Image as DreiImage } from '@react-three/drei';

// --- THE 3D ORBITING COMPONENT (Ring Removed) ---
function OrbitingGallery({ items }) {
    const groupRef = useRef();

    // Rotates the entire group of floating items continuously
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= delta * 0.15; // Slow, premium spin
        }
    });

    // Dynamic radius based on how many items are in the cart
    const radius = Math.max(2.5, items.length * 0.8);

    return (
        <group ref={groupRef}>
            {items.map((item, index) => {
                // Calculate perfect circular distribution
                const angle = (index / items.length) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                return (
                    <Float key={item._id} speed={2} rotationIntensity={0.2} floatIntensity={1.5} position={[x, 0, z]}>
                        {/* Billboard ensures the 2D transparent PNG always faces the camera! */}
                        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                            <Suspense fallback={null}>
                                <DreiImage
                                    url={item.product.images[0]}
                                    transparent
                                    scale={[2, 2.5]} // Adjust scale based on your image aspect ratios
                                />
                            </Suspense>
                        </Billboard>
                    </Float>
                );
            })}
        </group>
    );
}

// --- THE MAIN PAGE COMPONENT ---
export default function Cart3D() {
    const { cart, loading, updateQuantity, removeFromCart, getTotal } = useCart();
    const navigate = useNavigate();

    // Standardized the NeoShop gradient for consistency
    const neoGradient = 'bg-gradient-to-r from-purple-600 to-pink-500';

    if (loading) return <Loading />;

    // Beautiful Glassmorphism Empty State
    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FE] flex items-center justify-center p-4">
                <div className="bg-white/60 backdrop-blur-2xl p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center max-w-md border border-white">
                    <div className="text-6xl mb-6 drop-shadow-md">🛒</div>
                    <h2 className="text-3xl font-black mb-4 text-gray-900 tracking-tight">Your bag is empty.</h2>
                    <p className="text-gray-500 mb-8 font-medium">Ready to start building your collection?</p>
                    <Link
                        to="/products"
                        className={`inline-block ${neoGradient} text-white px-10 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-transform duration-300`}
                    >
                        Explore Lookbook
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FE] relative overflow-hidden flex flex-col lg:flex-row">

            {/* --- LEFT SIDE: THE 3D ZERO-GRAVITY CANVAS --- */}
            <div className="absolute inset-0 lg:relative lg:flex-1 h-[50vh] lg:h-auto z-0">
                <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
                    <ambientLight intensity={1.5} />
                    <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#e879f9" />
                    <Environment preset="city" />
                    <OrbitingGallery items={cart.items} />
                </Canvas>
            </div>

            {/* --- RIGHT SIDE: 2D GLASSMORPHISM UI --- */}
            <div className="w-full lg:w-[600px] h-full z-10 p-6 lg:p-12 overflow-y-auto no-scrollbar relative">

                <h1 className="text-4xl font-black tracking-tighter mb-8 mt-4 lg:mt-0 text-gray-900">
                    Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Collection.</span>
                </h1>

                {/* Glassy Cart Items List */}
                <div className="flex flex-col gap-4 mb-8">
                    {cart.items.map((item) => (
                        <div key={item._id} className="bg-white/70 backdrop-blur-xl p-4 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-white flex gap-4 transition-transform hover:scale-[1.02]">

                            {/* Tiny preview image for the list */}
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex-shrink-0 flex items-center justify-center p-2">
                                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain drop-shadow-md" />
                            </div>

                            <div className="flex-grow flex flex-col justify-center">
                                <h3 className="font-bold text-gray-900 line-clamp-1">{item.product.name}</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">
                                    Size: {item.size} | Color: {item.color}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-3 bg-gray-100/50 rounded-full px-3 py-1">
                                        <button onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} className="text-gray-500 hover:text-black font-bold px-1">-</button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="text-gray-500 hover:text-black font-bold px-1">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item._id)} className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-wider">Remove</button>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-center">
                                <p className="font-black text-lg text-gray-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Glassy Order Summary Box */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white p-8">
                    <h2 className="text-xl font-black mb-6 text-gray-900">Order Summary</h2>

                    <div className="space-y-4 mb-6 text-sm font-medium text-gray-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-gray-900 font-bold">₹{getTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="text-emerald-500 font-bold">Free</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (10%)</span>
                            <span className="text-gray-900 font-bold">₹{(getTotal() * 0.1).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200/50 pt-4 mb-8">
                        <div className="flex justify-between items-center text-2xl font-black">
                            <span>Total</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                                ₹{(getTotal() * 1.1).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/checkout')}
                        className={`w-full ${neoGradient} text-white py-4 rounded-full font-bold shadow-[0_10px_20px_rgba(168,85,247,0.2)] hover:shadow-[0_15px_30px_rgba(168,85,247,0.3)] transition-all duration-300 transform active:scale-95 text-sm uppercase tracking-widest`}
                    >
                        Secure Checkout
                    </button>
                </div>

            </div>
        </div>
    );
}