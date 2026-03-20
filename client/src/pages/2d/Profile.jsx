import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Loading from '../../components/common/Loading';

function Profile() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin only sees 'profile' tab, normal users default to 'orders'
    const [activeTab, setActiveTab] = useState(
        user?.role === 'admin' ? 'profile' : 'orders'
    );

    useEffect(() => {
        // Only fetch orders for normal users
        if (user?.role !== 'admin') {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, []);

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

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">My Account</h1>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-lg">{user?.name}</h3>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            {/* Show role badge for admin */}
                            {user?.role === 'admin' && (
                                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                    Admin
                                </span>
                            )}
                        </div>

                        <nav className="space-y-2">
                            {/* My Orders — only for normal users */}
                            {user?.role !== 'admin' && (
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    📦 My Orders
                                </button>
                            )}

                            {/* Profile Settings — visible to everyone */}
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                    }`}
                            >
                                👤 Profile Settings
                            </button>

                            {/* Wishlist — only for normal users */}
                            {user?.role !== 'admin' && (
                                <button
                                    onClick={() => setActiveTab('wishlist')}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'wishlist' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    ❤️ Wishlist
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-md p-8">

                        {/* Orders Tab — only for normal users */}
                        {activeTab === 'orders' && user?.role !== 'admin' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Order History</h2>

                                {loading ? (
                                    <Loading />
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-xl text-gray-600 mb-4">No orders yet</p>
                                        <a href="/products" className="text-primary hover:underline">
                                            Start shopping
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order._id} className="border rounded-lg p-6 hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Order ID</p>
                                                        <p className="font-semibold">#{order._id.slice(-8)}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Order Date</p>
                                                        <p className="font-semibold">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Total Amount</p>
                                                        <p className="text-2xl font-bold text-primary">
                                                            ₹{order.totalAmount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="border-t pt-4">
                                                    <p className="text-sm text-gray-600 mb-2">Items ({order.items.length})</p>
                                                    <div className="flex gap-2">
                                                        {order.items.slice(0, 3).map((item) => (
                                                            <img
                                                                key={item._id}
                                                                src={item.product.images[0]}
                                                                alt=""
                                                                className="w-16 h-16 object-cover rounded"
                                                            />
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                                                                +{order.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-3">
                                                    <button className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-purple-700 transition">
                                                        View Details
                                                    </button>
                                                    <button className="px-6 border-2 border-gray-300 rounded-lg hover:border-primary transition">
                                                        Track Order
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Settings Tab — visible to everyone */}
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">{user?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">{user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 capitalize">{user?.role}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Member Since</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                                            {new Date(user?.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab — only for normal users */}
                        {activeTab === 'wishlist' && user?.role !== 'admin' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                                <p className="text-gray-600">Your saved items</p>
                                {/* Add wishlist items */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;