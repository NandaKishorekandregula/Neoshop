import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Loading from '../../components/common/Loading';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Text, RoundedBox, Image as DreiImage, Sparkles } from '@react-three/drei';

// --- 3D COMPONENT: THE VIP BLACK CARD (For Profile Tab) ---
function VIPCard({ user }) {
    const cardRef = useRef();

    useFrame((state, delta) => {
        cardRef.current.rotation.y += delta * 0.3; // Premium, smooth spin
        cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1; // Gentle float
    });

    const memberDate = new Date(user?.createdAt || Date.now()).getFullYear();

    return (
        <group ref={cardRef} scale={1.2}>
            {/* The physical card body */}
            <RoundedBox args={[3.5, 2.2, 0.08]} radius={0.15} smoothness={4}>
                <meshPhysicalMaterial color="#111827" metalness={0.8} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
            </RoundedBox>

            {/* --- FRONT OF CARD --- */}
            <group position={[0, 0, 0.05]}>
                {/* Gold Chip */}
                <RoundedBox args={[0.5, 0.35, 0.01]} position={[-1.2, 0.4, 0]} radius={0.05}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.2} />
                </RoundedBox>

                <Text position={[0.8, 0.4, 0]} fontSize={0.25} color="#e879f9" fontStyle="italic" letterSpacing={0.1} anchorX="center" anchorY="middle">
                    NEOSHOP
                </Text>
                <Text position={[0.8, 0.1, 0]} fontSize={0.12} color="gray" letterSpacing={0.4} anchorX="center" anchorY="middle">
                    {user?.role === 'admin' ? 'ADMINISTRATOR' : 'EXCLUSIVE MEMBER'}
                </Text>

                <Text position={[-1.4, -0.6, 0]} fontSize={0.2} color="white" anchorX="left" anchorY="middle">
                    {(user?.name || 'MEMBER').toUpperCase()}
                </Text>
                <Text position={[1.4, -0.6, 0]} fontSize={0.12} color="gray" anchorX="right" anchorY="middle">
                    SINCE {memberDate}
                </Text>
            </group>

            {/* --- BACK OF CARD (Added Email!) --- */}
            <group position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
                {/* Magnetic Stripe */}
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[3.5, 0.4]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>

                <Text position={[0, -0.2, 0]} fontSize={0.12} color="gray" letterSpacing={0.2} anchorX="center" anchorY="middle">
                    AUTHORIZED USER
                </Text>
                {/* The User's Email */}
                <Text position={[0, -0.5, 0]} fontSize={0.18} color="white" anchorX="center" anchorY="middle">
                    {user?.email || 'user@example.com'}
                </Text>
            </group>
        </group>
    );
}

// --- 🌟 NEW 3D COMPONENT: COLLECTOR's CARD (For Orders Tab) ---
function CollectorsCard({ latestImageUrl }) {
    const cardRef = useRef();

    useFrame((state, delta) => {
        cardRef.current.rotation.y -= delta * 0.2; // Slow showcase spin
        cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    });

    return (
        <group ref={cardRef}>
            {/* The Trading Card Slab */}
            <RoundedBox args={[2.8, 3.8, 0.15]} radius={0.1} smoothness={4}>
                {/* Frosted dark glass aesthetic */}
                <meshPhysicalMaterial color="#1f2937" metalness={0.6} roughness={0.3} clearcoat={1} />
            </RoundedBox>

            {/* Glowing Inner Border */}
            <RoundedBox args={[2.6, 3.6, 0.16]} radius={0.08}>
                <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.5} />
            </RoundedBox>

            {/* Inner White Canvas for the Image */}
            <RoundedBox args={[2.5, 3.5, 0.17]} radius={0.06}>
                <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </RoundedBox>

            {/* --- FRONT OF TRADING CARD --- */}
            <group position={[0, 0, 0.1]}>
                {latestImageUrl ? (
                    <Suspense fallback={null}>
                        <DreiImage url={latestImageUrl} transparent scale={[2.2, 2.4]} position={[0, 0.2, 0]} />
                    </Suspense>
                ) : (
                    <Text position={[0, 0, 0]} fontSize={0.2} color="#111827" fontStyle="italic">
                        NO RECENT ORDERS
                    </Text>
                )}

                {/* Card Labels */}
                <Text position={[0, -1.1, 0]} fontSize={0.15} color="#a855f7" fontStyle="italic" letterSpacing={0.2} anchorX="center" anchorY="middle">
                    LATEST ACQUISITION
                </Text>
                <Text position={[0, -1.4, 0]} fontSize={0.25} color="#111827" fontStyle="italic" letterSpacing={0.1} anchorX="center" anchorY="middle">
                    NEOSHOP
                </Text>
            </group>

            {/* --- BACK OF TRADING CARD --- */}
            <group position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}>
                <Text position={[0, 0, 0]} fontSize={0.4} color="#a855f7" fontStyle="italic" anchorX="center" anchorY="middle">
                    NEOSHOP
                </Text>
                <Text position={[0, -0.6, 0]} fontSize={0.15} color="#111827" letterSpacing={0.1} anchorX="center" anchorY="middle">
                    AUTHENTICATED COLLECTION
                </Text>
            </group>

            {/* Premium Sparkles surrounding the collectible */}
            <Sparkles count={30} scale={4} size={2} speed={0.4} opacity={0.5} color="#e879f9" />
        </group>
    );
}

// --- 3D COMPONENT: SCENE CONTROLLER ---
function ProfileScene({ activeTab, user, latestImageUrl }) {
    return (
        <Suspense fallback={null}>
            {activeTab === 'profile' && <VIPCard user={user} />}
            {activeTab === 'orders' && <CollectorsCard latestImageUrl={latestImageUrl} />}
            {activeTab === 'wishlist' && (
                <Float speed={3} floatIntensity={2}>
                    <Text fontSize={1.5} color="#ec4899">♥</Text>
                </Float>
            )}
        </Suspense>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function Profile3D() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'profile' : 'orders');

    const neoGradient = 'bg-gradient-to-r from-purple-600 to-pink-500';

    useEffect(() => {
        if (user?.role !== 'admin') {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const response = await API.get('/orders/my-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Grab the image of their most recent purchase
    const latestImageUrl = orders.length > 0 && orders[0].items.length > 0
        ? orders[0].items[0].product.images[0]
        : null;

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return <Loading />;

    return (
        <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FE] relative overflow-hidden flex flex-col lg:flex-row">

            {/* --- RIGHT SIDE: THE DYNAMIC 3D CANVAS --- */}
            <div className="absolute inset-0 lg:relative lg:flex-1 h-[40vh] lg:h-auto z-0 bg-gradient-to-br from-[#F8F9FE] to-[#eef2fc]">
                <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
                    <ambientLight intensity={1.5} />
                    <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#e879f9" />
                    <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={1} color="#c084fc" />
                    <Environment preset="city" />
                    <ProfileScene activeTab={activeTab} user={user} latestImageUrl={latestImageUrl} />
                </Canvas>
            </div>

            {/* --- LEFT SIDE: GLASSMORPHISM DASHBOARD --- */}
            <div className="w-full lg:w-[650px] h-full z-10 p-6 lg:p-12 overflow-y-auto no-scrollbar relative flex flex-col">

                <h1 className="text-4xl font-black tracking-tighter mb-8 text-gray-900">
                    Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Headquarters.</span>
                </h1>

                {/* Dashboard Navigation Tabs */}
                <div className="flex gap-2 mb-8 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white shadow-sm overflow-x-auto no-scrollbar">
                    {user?.role !== 'admin' && (
                        <button onClick={() => setActiveTab('orders')} className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'orders' ? `${neoGradient} text-white shadow-md` : 'text-gray-500 hover:bg-white'}`}>
                            📦 Orders
                        </button>
                    )}
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'profile' ? `${neoGradient} text-white shadow-md` : 'text-gray-500 hover:bg-white'}`}>
                        👤 Profile
                    </button>
                    {user?.role !== 'admin' && (
                        <button onClick={() => setActiveTab('wishlist')} className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'wishlist' ? `${neoGradient} text-white shadow-md` : 'text-gray-500 hover:bg-white'}`}>
                            ❤️ Wishlist
                        </button>
                    )}
                </div>

                {/* Tab Content Container */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white p-8 mb-6">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="animate-fadeIn space-y-6">
                            <div className="flex items-center gap-6 mb-8">
                                <div className={`w-20 h-20 ${neoGradient} rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg`}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">{user?.name}</h2>
                                    <p className="text-gray-500 font-medium">{user?.email}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest rounded-full">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Member Since</label>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && user?.role !== 'admin' && (
                        <div className="animate-fadeIn">
                            {orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4">🛍️</div>
                                    <p className="text-lg font-bold text-gray-900 mb-2">No orders yet</p>
                                    <p className="text-gray-500 text-sm mb-6">Your digital wardrobe is waiting.</p>
                                    <a href="/products" className={`inline-block px-8 py-3 rounded-full font-bold text-white shadow-lg transition-transform hover:-translate-y-1 ${neoGradient}`}>
                                        Start Shopping
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300 group">
                                            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{order._id.slice(-6)}</p>
                                                    <p className="text-sm font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-3">
                                                    {order.items.slice(0, 3).map((item, idx) => (
                                                        <img key={item._id} src={item.product.images[0]} alt="" className="w-12 h-12 object-cover rounded-full border-2 border-white shadow-sm z-[3] relative" style={{ zIndex: 10 - idx }} />
                                                    ))}
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                                                    <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                                                        ₹{order.totalAmount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* WISHLIST TAB */}
                    {activeTab === 'wishlist' && user?.role !== 'admin' && (
                        <div className="animate-fadeIn text-center py-12">
                            <p className="text-lg font-bold text-gray-900 mb-2">Your Wishlist</p>
                            <p className="text-gray-500 text-sm">Features coming soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}