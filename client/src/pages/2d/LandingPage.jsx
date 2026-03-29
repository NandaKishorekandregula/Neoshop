import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, ContactShadows } from '@react-three/drei';
import ShoeModel from '../../components/3d/ShoeModel';
// 🌟 Import Auth Context
import { useAuth } from '../../context/AuthContext';
// 🌟 Import routing hook (assuming react-router-dom)
import { useNavigate } from 'react-router-dom';

export default function LandingPage2D({ is3DMode, setIs3DMode }) {
    // 🌟 Check if the user is an admin
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.isAdmin;

    // 🌟 Initialize navigation
    const navigate = useNavigate();

    // 🌟 Handle AI Advisor Button Click
    const handleAIAdvisorClick = () => {
        if (user) {
            // Redirect to AI advisor if logged in
            navigate('/ai-advisor');
        } else {
            // Redirect to login if not logged in
            navigate('/login');
        }
    };

    return (
        <div className="w-full h-[calc(100vh-80px)] bg-[#F8F9FE] relative flex items-center justify-center overflow-hidden">

            {/* BACKGROUND ORBS */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-400/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12 z-10">

                {/* --- THE PREMIUM 2D PRODUCT CARD --- */}
                <div className="flex-1 w-full max-w-lg relative flex items-center justify-center h-[500px] group">

                    <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-[40px] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-transform duration-700 group-hover:scale-[1.02]"></div>
                    <div className="absolute w-64 h-64 bg-gradient-to-tr from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-60"></div>

                    <div className="relative z-10 w-full h-[120%] -mt-12 pointer-events-none">
                        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                            <ambientLight intensity={1.2} />
                            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} color="#e879f9" />
                            <spotLight position={[-10, 10, -10]} angle={0.2} penumbra={1} intensity={1.5} color="#c084fc" />
                            <Environment preset="city" />

                            <Suspense fallback={null}>
                                <Float speed={2.5} rotationIntensity={0.05} floatIntensity={1.5}>
                                    <ShoeModel position={[0, -0.2, 0]} rotation={[0.1, -1.2, 0]} scale={1.3} />
                                </Float>
                                <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#a855f7" />
                            </Suspense>
                        </Canvas>
                    </div>

                </div>

                {/* Text Content */}
                <div className="flex-1 text-left">
                    <h1 className="text-[8vw] md:text-7xl font-black text-gray-900 leading-tight tracking-tighter mb-4">
                        Classic <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Lookbook.</span>
                    </h1>
                    {/* 🌟 Updated Description */}
                    <p className="text-gray-500 font-medium text-xl max-w-md mb-8 leading-relaxed">
                        Step into our immersive 3D mode guided by your personal AI Advisor. Simply upload a profile photo, and our intelligent stylist will recommend the perfect outfits and colors perfectly matched to your skin tone and style.
                    </p>
                </div>

            </div>

            {/* --- THE TOGGLE SWITCH --- */}
            {/* 🌟 Wrapped in a condition: Only render this UI if the user is NOT an admin */}
            {!isAdmin && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4">
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase drop-shadow-sm">Select Experience</span>
                    <div onClick={() => setIs3DMode(!is3DMode)} className="relative flex items-center w-[280px] h-[64px] bg-[#F8F9FE] rounded-full p-2 cursor-pointer shadow-[inset_6px_6px_12px_#dce1f0,inset_-6px_-6px_12px_#ffffff]">
                        <div className="absolute w-full flex justify-between px-8 text-gray-400 font-bold z-0 pointer-events-none text-[11px] tracking-wider">
                            <span className="w-[120px] text-center">2D LOOKBOOK</span>
                            <span className="w-[120px] text-center">3D STUDIO</span>
                        </div>
                        <div className={`relative flex items-center justify-center w-[130px] h-[48px] bg-[#F8F9FE] rounded-full shadow-[4px_4px_8px_#dce1f0,-4px_-4px_8px_#ffffff] transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)] z-10 ${is3DMode ? 'translate-x-[134px]' : 'translate-x-0'}`}>
                            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-black text-xs tracking-wider">{is3DMode ? '3D STUDIO' : '2D LOOKBOOK'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 🌟 FLOATING AI ADVISOR BUTTON --- */}
            <button
                onClick={handleAIAdvisorClick}
                className="fixed bottom-8 right-8 h-14 px-6 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full shadow-[0_10px_25px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 text-white hover:scale-105 hover:-translate-y-1 transition-all duration-300 z-50 group border-2 border-white/20"
                aria-label="Ask AI Advisor"
            >
                {/* Sparkles / Magic Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6 group-hover:animate-pulse"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                {/* 🌟 New Button Text */}
                <span className="font-bold tracking-wide">AI Advisor</span>
            </button>

        </div>
    );
}