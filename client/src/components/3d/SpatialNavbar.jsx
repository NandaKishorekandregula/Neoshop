import React, { useState, useEffect } from 'react';
import { Html, Float } from '@react-three/drei';

export default function SpatialNavbar({ navigate, user, logout, cartItemsCount }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const handleNavigation = (path) => (e) => {
        e.preventDefault();
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkCSS = "text-gray-300 hover:text-white font-bold tracking-widest transition-colors cursor-pointer text-[10px] md:text-sm uppercase";

    return (
        <Float speed={2.5} rotationIntensity={0.1} floatIntensity={2} position={[0, 0, -1.5]}>
            <Html center zIndexRange={[100, 0]}>

                <div className={`flex items-center gap-3 md:gap-8 px-4 md:px-10 py-2.5 md:py-4 bg-gray-900/85 backdrop-blur-xl border border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.2)] rounded-full select-none transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}>

                    {/* Logo */}
                    <a href="/" onClick={handleNavigation('/')} className="flex items-center gap-2 md:gap-3 mr-2 md:mr-6 cursor-pointer">
                        <span className="text-xl md:text-3xl drop-shadow-lg">🛍️</span>
                        <span className="hidden md:block text-2xl font-black text-white tracking-wider">
                            NeoShop
                        </span>
                    </a>

                    {/* Links */}
                    <div className="flex items-center gap-3 md:gap-8">
                        <a href="/products" onClick={handleNavigation('/products')} className={linkCSS}>PRODUCTS</a>

                        {user ? (
                            <>
                                <a href="/profile" onClick={handleNavigation('/profile')} className={linkCSS}>PROFILE</a>
                                <a href="/cart" onClick={handleNavigation('/cart')} className={`relative ${linkCSS}`}>
                                    CART
                                    {cartItemsCount > 0 && (
                                        <span className="absolute -top-3 -right-3 md:-right-4 bg-pink-500 text-white text-[9px] md:text-[10px] font-black rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow-lg">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </a>
                                <button onClick={handleLogout} className="ml-1 md:ml-4 px-3 py-1.5 md:px-6 md:py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] md:text-sm font-bold rounded-full shadow-lg transition-all">
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="/login" onClick={handleNavigation('/login')} className={linkCSS}>LOGIN</a>
                                <a href="/register" onClick={handleNavigation('/register')} className="ml-1 md:ml-2 px-3 py-1.5 md:px-6 md:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] md:text-sm font-bold rounded-full shadow-[0_4px_15px_rgba(236,72,153,0.4)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.6)] transition-all cursor-pointer">
                                    SIGN UP
                                </a>
                            </>
                        )}
                    </div>

                </div>
            </Html>
        </Float>
    );
}