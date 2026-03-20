import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Loading from '../../components/common/Loading';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await API.get('/admin/orders');
            setOrders(res.data.orders);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await API.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev =>
                prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
            );
        } catch (err) { alert('Failed to update status'); }
    };

    const filtered = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    if (loading) return <Loading />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Orders</h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', ...STATUS_OPTIONS].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${statusFilter === s
                                ? 'bg-purple-700 text-white'
                                : 'bg-white border hover:border-purple-500'
                            }`}
                    >{s}</button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-4 px-4">Order ID</th>
                            <th className="text-left py-4 px-4">Customer</th>
                            <th className="text-left py-4 px-4">Date</th>
                            <th className="text-left py-4 px-4">Items</th>
                            <th className="text-left py-4 px-4">Total</th>
                            <th className="text-left py-4 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => (
                            <tr key={order._id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-mono text-xs">#{order._id.slice(-8)}</td>
                                <td className="py-3 px-4">
                                    <p className="font-semibold">{order.user?.name}</p>
                                    <p className="text-gray-500 text-xs">{order.user?.email}</p>
                                </td>
                                <td className="py-3 px-4">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">{order.items.length} items</td>
                                <td className="py-3 px-4 font-bold">₹{order.totalAmount.toFixed(2)}</td>
                                <td className="py-3 px-4">
                                    <select
                                        value={order.status}
                                        onChange={e => handleStatusChange(order._id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer
                      ${statusColors[order.status]}`}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No orders found.</div>
                )}
            </div>
        </div>
    );
}

export default AdminOrders;