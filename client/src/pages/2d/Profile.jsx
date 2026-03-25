import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Loading from '../../components/2d/common/Loading';

function Profile() {
    const { user, setUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(
        user?.role === 'admin' ? 'profile' : 'orders'
    );

    // Photo upload states
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const fileInputRef = useRef(null);

    // Profile edit states
    const [editName, setEditName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
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

    // ── Upload photo to Cloudinary then save URL to DB ──
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setPhotoError('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPhotoError('Image must be under 5MB');
            return;
        }

        setPhotoUploading(true);
        setPhotoError('');

        try {
            // Step 1: Upload to Cloudinary via your existing upload endpoint
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await API.post('/upload/single', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const photoUrl = uploadRes.data.url;

            // Step 2: Save the URL to the user's profile in DB
            const updateRes = await API.put('/auth/update-profile', {
                profilePhoto: photoUrl,
                name: user.name,
            });

            // Step 3: Update user in AuthContext so navbar/avatar updates everywhere
            setUser(updateRes.data);

        } catch (err) {
            setPhotoError('Failed to upload photo. Please try again.');
            console.error(err);
        } finally {
            setPhotoUploading(false);
        }
    };

    // ── Save name update ──
    const handleSaveProfile = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        setSaveSuccess(false);
        try {
            const res = await API.put('/auth/update-profile', {
                name: editName,
                profilePhoto: user?.profilePhoto || '',
            });
            setUser(res.data);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">My Account</h1>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* ── Sidebar ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6">

                        {/* Avatar with upload */}
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                {/* Photo or initial */}
                                {user?.profilePhoto ? (
                                    <img
                                        src={user.profilePhoto}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover mx-auto"
                                        style={{ border: '3px solid #6366f1' }}
                                    />
                                ) : (
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl mx-auto"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                    >
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Upload button overlay */}
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={photoUploading}
                                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs cursor-pointer border-2 border-white"
                                    style={{ background: '#6366f1' }}
                                    title="Change photo"
                                >
                                    {photoUploading ? '⏳' : '📷'}
                                </button>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Upload status */}
                            {photoUploading && (
                                <p className="text-xs text-indigo-500 mt-2 font-semibold">Uploading...</p>
                            )}
                            {photoError && (
                                <p className="text-xs text-red-500 mt-2">{photoError}</p>
                            )}

                            {/* Clickable hint */}
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={photoUploading}
                                className="text-xs text-gray-400 hover:text-indigo-500 transition mt-2 block w-full"
                            >
                                Click 📷 to change photo
                            </button>

                            <h3 className="font-bold text-lg mt-3">{user?.name}</h3>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            {user?.role === 'admin' && (
                                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                    Admin
                                </span>
                            )}
                        </div>

                        {/* Nav tabs */}
                        <nav className="space-y-2">
                            {user?.role !== 'admin' && (
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    📦 My Orders
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                    }`}
                            >
                                👤 Profile Settings
                            </button>
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

                {/* ── Main Content ── */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-md p-8">

                        {/* Orders Tab */}
                        {activeTab === 'orders' && user?.role !== 'admin' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Order History</h2>
                                {loading ? (
                                    <Loading />
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-xl text-gray-600 mb-4">No orders yet</p>
                                        <a href="/products" className="text-primary hover:underline">Start shopping</a>
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
                                                                src={item.product?.images?.[0]}
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

                        {/* Profile Settings Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                                {/* Profile Photo Section */}
                                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="font-semibold text-gray-700 mb-4">Profile Photo</h3>
                                    <div className="flex items-center gap-6">
                                        {user?.profilePhoto ? (
                                            <img
                                                src={user.profilePhoto}
                                                alt="Profile"
                                                className="w-20 h-20 rounded-full object-cover"
                                                style={{ border: '3px solid #6366f1' }}
                                            />
                                        ) : (
                                            <div
                                                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                            >
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={photoUploading}
                                                className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-50"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                            >
                                                {photoUploading ? '⏳ Uploading...' : '📷 Upload New Photo'}
                                            </button>
                                            <p className="text-xs text-gray-400 mt-2">JPG, PNG or WEBP · Max 5MB</p>
                                            {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                                            {user?.email} <span className="text-xs text-gray-400">(cannot be changed)</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 capitalize">{user?.role}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Member Since</label>
                                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                                            {user?.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })
                                                : 'N/A'}
                                        </p>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={saving || editName === user?.name}
                                            className="px-8 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        {saveSuccess && (
                                            <span className="text-green-600 text-sm font-semibold">
                                                ✅ Profile updated!
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && user?.role !== 'admin' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                                <p className="text-gray-600">Your saved items will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;