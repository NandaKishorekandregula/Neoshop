import React, { useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import API from '../../utils/api';
import { Canvas, useFrame } from '@react-three/fiber';
// 🌟 Added 'Sparkles' to the drei imports for Step 3!
import { Environment, Float, Text, RoundedBox, Sphere, MeshDistortMaterial, Sparkles } from '@react-three/drei';

// --- 3D COMPONENT: STEP 1 (SHIPPING GLOBE) ---
function ShippingGlobe() {
    const globeRef = useRef();
    useFrame((state, delta) => {
        globeRef.current.rotation.y += delta * 0.2;
        globeRef.current.rotation.x += delta * 0.1;
    });
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
            <group ref={globeRef}>
                <Sphere args={[2, 32, 32]}>
                    <meshStandardMaterial color="#c084fc" wireframe={true} transparent opacity={0.3} />
                </Sphere>
                <Sphere args={[1.9, 32, 32]}>
                    <MeshDistortMaterial color="#a855f7" speed={2} distort={0.2} transparent opacity={0.8} />
                </Sphere>
            </group>
        </Float>
    );
}

// --- 3D COMPONENT: STEP 2 (INTERACTIVE CREDIT CARD) ---
function InteractiveCard({ ccData, isFlipped }) {
    const cardRef = useRef();

    useFrame((state, delta) => {
        const targetRotation = isFlipped ? Math.PI : 0;
        cardRef.current.rotation.y += (targetRotation - cardRef.current.rotation.y) * 0.1;
        cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    });

    const displayName = (ccData.name || 'CARDHOLDER NAME').toUpperCase();

    return (
        <group ref={cardRef}>
            <RoundedBox args={[4.5, 2.8, 0.1]} radius={0.15} smoothness={4}>
                <meshPhysicalMaterial color="#111827" metalness={0.8} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
            </RoundedBox>

            {/* Front */}
            <group position={[0, 0, 0.06]}>
                <RoundedBox args={[0.6, 0.4, 0.01]} position={[-1.6, 0.5, 0]} radius={0.05}>
                    <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.2} />
                </RoundedBox>
                <Text position={[1.4, 0.9, 0]} fontSize={0.25} color="#e879f9" anchorX="center" anchorY="middle">NeoShop</Text>
                <Text position={[-1.8, -0.2, 0]} fontSize={0.3} letterSpacing={0.1} color="white" anchorX="left" anchorY="middle">{ccData.number || '•••• •••• •••• ••••'}</Text>
                <Text position={[-1.8, -0.9, 0]} fontSize={0.15} color="gray" anchorX="left" anchorY="middle">{displayName}</Text>
                <Text position={[1.8, -0.9, 0]} fontSize={0.15} color="gray" anchorX="right" anchorY="middle">{ccData.expiry || 'MM/YY'}</Text>
            </group>

            {/* Back */}
            <group position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
                <mesh position={[0, 0.6, 0]}>
                    <planeGeometry args={[4.5, 0.5]} />
                    <meshBasicMaterial color="black" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[3, 0.3]} />
                    <meshBasicMaterial color="white" />
                </mesh>
                <Text position={[1.2, 0, 0.01]} fontSize={0.2} color="black" anchorX="right" anchorY="middle">{ccData.cvv || '•••'}</Text>
            </group>
        </group>
    );
}

// --- 🌟 NEW 3D COMPONENT: STEP 3 (DELIVERY BOX) ---
function DeliveryBox() {
    const groupRef = useRef();

    useFrame((state, delta) => {
        // Slowly spin the box like a showroom display
        groupRef.current.rotation.y += delta * 0.4;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    });

    return (
        <group ref={groupRef} scale={1.2}>
            {/* The Main Box */}
            <RoundedBox args={[2, 1.5, 2]} radius={0.05} smoothness={4}>
                <meshPhysicalMaterial color="#1f2937" metalness={0.1} roughness={0.9} />
            </RoundedBox>

            {/* Glowing Brand Tape (Horizontal wrap) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2.02, 1.52, 0.4]} />
                <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1} />
            </mesh>

            {/* Glowing Brand Tape (Vertical wrap) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.4, 1.52, 2.02]} />
                <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1} />
            </mesh>

            {/* Magical Floating Sparkles! */}
            <Sparkles count={50} scale={4} size={3} speed={0.4} opacity={0.6} color="#e879f9" />
        </group>
    );
}

// --- 3D COMPONENT: SCENE CONTROLLER ---
function SceneController({ step, ccData, isFlipped }) {
    return (
        <Suspense fallback={null}>
            {step === 1 && <ShippingGlobe />}
            {step === 2 && <InteractiveCard ccData={ccData} isFlipped={isFlipped} />}
            {/* 🌟 Swapped the Torus for the Delivery Box! */}
            {step === 3 && <DeliveryBox />}
        </Suspense>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function Checkout3D() {
    const { cart, getTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const neoGradient = 'bg-gradient-to-r from-purple-600 to-pink-500';

    const [shippingAddress, setShippingAddress] = useState({
        fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', phone: ''
    });

    const [ccData, setCcData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [isCvvFocused, setIsCvvFocused] = useState(false);

    const handleShippingChange = (e) => setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    const handleCcChange = (e) => setCcData({ ...ccData, [e.target.name]: e.target.value });

    const validateShipping = () => {
        const required = ['fullName', 'addressLine1', 'city', 'state', 'zipCode', 'phone'];
        for (let field of required) {
            if (!shippingAddress[field]) return setError(`Please fill in ${field}`), false;
        }
        return true;
    };

    const validatePayment = () => {
        if (!ccData.number || !ccData.name || !ccData.expiry || !ccData.cvv) {
            return setError('Please fill in all card details'), false;
        }
        return true;
    }

    const handleNextStep = () => {
        if (step === 1 && validateShipping()) { setError(''); setStep(2); } 
        else if (step === 2 && validatePayment()) { setError(''); setStep(3); }
    };

    const handlePlaceOrder = async () => {
        setLoading(true); setError('');
        try {
            const orderData = {
                items: cart.items.map(item => ({
                    product: item.product._id, quantity: item.quantity, price: item.product.price, size: item.size, color: item.color
                })),
                shippingAddress,
                totalAmount: getTotal() * 1.1 
            };
            const response = await API.post('/orders', orderData);
            await clearCart();
            navigate(`/order-success/${response.data._id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] bg-[#F8F9FE] relative overflow-hidden flex flex-col lg:flex-row">
            
            <div className="absolute inset-0 lg:relative lg:flex-1 h-[40vh] lg:h-auto z-0 bg-gradient-to-br from-[#F8F9FE] to-[#eef2fc]">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <ambientLight intensity={1} />
                    <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#e879f9" />
                    <Environment preset="city" />
                    <SceneController step={step} ccData={ccData} isFlipped={isCvvFocused} />
                </Canvas>
            </div>

            <div className="w-full lg:w-[650px] h-full z-10 p-6 lg:p-12 overflow-y-auto no-scrollbar relative flex flex-col">
                <h1 className="text-4xl font-black tracking-tighter mb-8 text-gray-900">
                    Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Checkout.</span>
                </h1>

                <div className="flex items-center justify-between mb-8 px-4 relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
                    {[1, 2, 3].map((num, idx) => (
                        <div key={num} className="flex flex-col items-center bg-[#F8F9FE] px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${step >= num ? `${neoGradient} text-white shadow-lg` : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                {num}
                            </div>
                            <span className={`text-xs mt-2 font-bold ${step >= num ? 'text-gray-900' : 'text-gray-400'}`}>
                                {['Shipping', 'Payment', 'Review'][idx]}
                            </span>
                        </div>
                    ))}
                </div>

                {error && <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-semibold">{error}</div>}

                <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white p-8 mb-6">
                    
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-2xl font-black mb-6 text-gray-900">Shipping Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><input type="text" name="fullName" placeholder="Full Name" value={shippingAddress.fullName} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                                <div className="col-span-2"><input type="text" name="addressLine1" placeholder="Address Line 1" value={shippingAddress.addressLine1} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                                <div><input type="text" name="city" placeholder="City" value={shippingAddress.city} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                                <div><input type="text" name="zipCode" placeholder="Zip Code" value={shippingAddress.zipCode} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                                <div><input type="text" name="state" placeholder="State" value={shippingAddress.state} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                                <div><input type="tel" name="phone" placeholder="Phone" value={shippingAddress.phone} onChange={handleShippingChange} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" /></div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-2xl font-black mb-6 text-gray-900">Payment Method</h2>
                            <p className="text-xs text-purple-600 font-bold mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">✨ Watch the 3D card update as you type! (Demo Mode)</p>
                            <div className="space-y-4">
                                <div><input type="text" name="number" placeholder="Card Number (0000 0000 0000 0000)" maxLength="19" value={ccData.number} onChange={handleCcChange} onFocus={() => setIsCvvFocused(false)} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono" /></div>
                                <div><input type="text" name="name" placeholder="Name on Card" value={ccData.name} onChange={handleCcChange} onFocus={() => setIsCvvFocused(false)} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none uppercase" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="expiry" placeholder="MM/YY" maxLength="5" value={ccData.expiry} onChange={handleCcChange} onFocus={() => setIsCvvFocused(false)} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono" />
                                    <input type="text" name="cvv" placeholder="CVV" maxLength="3" value={ccData.cvv} onChange={handleCcChange} onFocus={() => setIsCvvFocused(true)} onBlur={() => setIsCvvFocused(false)} className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-black text-gray-900">Review Order</h2>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping To</h3>
                                <p className="font-bold text-gray-900">{shippingAddress.fullName}</p>
                                <p className="text-sm text-gray-600">{shippingAddress.addressLine1}, {shippingAddress.city}</p>
                                <p className="text-sm text-gray-600">{shippingAddress.zipCode}</p>
                            </div>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Total Amount</h3>
                                <div className="flex justify-between items-center text-3xl font-black">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">₹{(getTotal() * 1.1).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Includes free shipping and 10% tax.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-auto">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-4 font-bold text-gray-500 hover:text-gray-900 transition-colors">← Back</button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button onClick={handleNextStep} className={`px-10 py-4 ${neoGradient} text-white rounded-full font-bold shadow-[0_10px_20px_rgba(168,85,247,0.2)] hover:shadow-lg transition-all transform active:scale-95`}>Continue →</button>
                    ) : (
                        <button onClick={handlePlaceOrder} disabled={loading} className={`px-10 py-4 ${neoGradient} text-white rounded-full font-bold shadow-[0_10px_20px_rgba(168,85,247,0.2)] hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50`}>
                            {loading ? 'Processing...' : 'Confirm & Pay'}
                        </button>
                    )}
                </div>
                
            </div>
        </div>
    );
}