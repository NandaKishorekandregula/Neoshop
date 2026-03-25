import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

export default function Navbar({ is3DMode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { user, logout } = useAuth();
    const { getItemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // 🌟 ALWAYS hide this 2D navbar across ALL pages when in 3D Mode!
    if (is3DMode) return null;

    const cartItemsCount = user ? getItemCount() : 0;
    const isSignUp = location.pathname === '/register';

    const handleAnimatedLogout = () => {
        setIsLoggingOut(true);
        setTimeout(() => {
            logout();
            setIsLoggingOut(false);
            navigate('/login');
        }, 300);
    };

    const AuthToggle = () => {
        if (user) {
            return (
                <div onClick={handleAnimatedLogout} className="relative w-32 h-10 bg-[#E2E8F0] shadow-[inset_0_3px_6px_rgba(0,0,0,0.16)] rounded-full flex items-center p-1 cursor-pointer overflow-hidden">
                    <div className={`absolute w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${isLoggingOut ? 'translate-x-[5.5rem]' : 'translate-x-0'}`}></div>
                    <span className={`w-full text-center text-sm font-bold text-gray-500 z-10 transition-opacity duration-300 pl-6 ${isLoggingOut ? 'opacity-0' : 'opacity-100'}`}>Logout</span>
                </div>
            );
        }

        return (
            <div className="relative w-44 h-10 bg-[#E2E8F0] shadow-[inset_0_3px_6px_rgba(0,0,0,0.16)] rounded-full flex items-center p-1 cursor-pointer" onClick={() => navigate(isSignUp ? '/login' : '/register')}>
                <div className={`absolute w-[48%] h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${isSignUp ? 'translate-x-[96%]' : 'translate-x-0'}`}></div>
                <span className={`flex-1 text-center text-sm font-bold z-10 transition-colors duration-300 ${!isSignUp ? 'text-white' : 'text-gray-500'}`}>Login</span>
                <span className={`flex-1 text-center text-sm font-bold z-10 transition-colors duration-300 ${isSignUp ? 'text-white' : 'text-gray-500'}`}>Sign Up</span>
            </div>
        );
    };

    const linkClasses = "font-semibold transition-colors hover:text-purple-600 text-gray-600";

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-3xl">🛍️</span>
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
                            NeoShop
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        {user?.role === 'admin' ? (
                            <>
                                <Link to="/admin" className={linkClasses}>Admin Panel</Link>
                                <Link to="/profile" className={linkClasses}>Profile</Link>
                                <AuthToggle />
                            </>
                        ) : user ? (
                            <>
                                <Link to="/products" className={linkClasses}>Products</Link>
                                <Link to="/profile" className={linkClasses}>Profile</Link>
                                <Link to="/ai-advisor">AI Advisor</Link>
                                <Link to="/cart" className={`relative flex items-center ${linkClasses}`}>
                                    <span className="mr-1 text-lg">🛒</span> Cart
                                    {cartItemsCount > 0 && (
                                        <span className="absolute -top-3 -right-4 bg-pink-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{cartItemsCount}</span>
                                    )}
                                </Link>
                                <AuthToggle />
                            </>
                        ) : (
                            <>
                                <Link to="/products" className={linkClasses}>Products</Link>
                                <AuthToggle />
                            </>
                        )}
                    </div>

                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden focus:outline-none text-gray-600 hover:text-purple-600">
                        {isMenuOpen ? (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        ) : (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                        )}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden pb-6 pt-2 space-y-4 px-2 border-t bg-white border-gray-100">
                        <Link to="/products" onClick={() => setIsMenuOpen(false)} className={`block py-2 px-4 rounded-lg hover:bg-gray-50 ${linkClasses}`}>Products</Link>
                        <div className="px-4 py-2 w-full flex justify-center"><AuthToggle /></div>
                    </div>
                )}
            </div>
        </nav>
    );
}