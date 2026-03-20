import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '✔', exact: true },
    { path: '/admin/analytics', label: 'Analytics', icon: '⚲' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/orders', label: 'Orders', icon: '🧾' },
];

function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure 'user' and 'logout' from your AuthContext
    const { user, logout } = useAuth();

    // Dynamically grab the user's name (with a fallback)
    const userName = user?.name || "Stylist";
    const firstLetter = userName.charAt(0).toUpperCase();

    const isActive = (path, exact) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#E8EAF6] p-4 sm:p-8 flex items-center justify-center font-sans text-gray-600">

            {/* The Unified "App Window" Card */}
            <div className="w-full max-w-[1400px] h-[90vh] bg-[#F8F9FE] rounded-[40px] shadow-[0_20px_60px_rgba(200,205,225,0.6)] flex overflow-hidden border border-white">

                {/* Sidebar */}
                <aside className="w-[240px] bg-transparent flex flex-col py-8 px-4 relative z-20">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 px-4 mb-10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <span className="text-white text-xs font-bold">▶</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">NeoShop</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const active = isActive(item.path, item.exact);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm ${active
                                            ? 'bg-[#EAEBFE] text-indigo-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-800'
                                        }`}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-md ${active ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Logout Button */}
                    <div className="mt-auto px-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50/80 text-red-600 hover:bg-red-100 rounded-2xl transition-all font-medium text-sm border border-red-100 shadow-sm"
                        >
                            <span className="text-lg">🚪</span> Logout
                        </button>
                    </div>
                </aside>

                {/* Main Dashboard Area */}
                <main className="flex-1 flex flex-col h-full bg-transparent p-8 pl-4 relative overflow-hidden">

                    {/* ✨ The Glowing Orbs for Glassmorphism Background ✨ */}
                    <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-purple-200/60 rounded-full mix-blend-multiply filter blur-[100px] z-0 pointer-events-none"></div>
                    <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-200/50 rounded-full mix-blend-multiply filter blur-[100px] z-0 pointer-events-none"></div>

                    {/* Upper Navbar (Now with Frosted Glass) */}
                    <header className="w-full h-[70px] bg-white/70 backdrop-blur-md rounded-2xl flex justify-between items-center px-6 shadow-[0_4px_20px_rgba(220,225,240,0.5)] shrink-0 mb-6 border border-white/60 relative z-10">

                        <div className="text-gray-700 font-medium text-sm">
                            Welcome back, {userName} 👋
                        </div>

                        <div className="flex items-center">
                            {/* Dynamic Profile Initial */}
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shadow-sm border border-indigo-200">
                                {firstLetter}
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Dashboard Content */}
                    <div className="flex-1 overflow-auto overflow-x-hidden pr-2 custom-scrollbar relative z-10">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}

export default AdminLayout;