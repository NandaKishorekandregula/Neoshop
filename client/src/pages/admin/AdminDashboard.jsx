import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import API from '../../utils/api';
import Loading from '../../components/2d/common/Loading';

// StatCard updated with Glassmorphism Tailwind classes
function StatCard({ label, value, icon, trend, trendUp, iconBg, iconColor }) {
    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-transform hover:-translate-y-1 duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-green-50/80 text-green-600' : 'bg-red-50/80 text-red-600'
                        }`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
        </div>
    );
}

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, salesRes] = await Promise.all([
                API.get('/admin/dashboard'),
                API.get('/admin/analytics/sales?period=30'),
            ]);
            setStats(statsRes.data);
            setSalesData(salesRes.data.map(d => ({
                date: `${d._id.month}/${d._id.day}`,
                revenue: d.total,
                orders: d.count,
            })));
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-10">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Total Revenue"
                    value={`₹${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
                    icon="💰" iconBg="bg-indigo-50/80" iconColor="text-indigo-600"
                    trend="15.2%" trendUp={true}
                />
                <StatCard
                    label="Total Orders"
                    value={stats?.totalOrders || 0}
                    icon="🧾" iconBg="bg-purple-50/80" iconColor="text-purple-600"
                    trend="4.1%" trendUp={true}
                />
                <StatCard
                    label="Total Products"
                    value={stats?.totalProducts || 0}
                    icon="📦" iconBg="bg-blue-50/80" iconColor="text-blue-600"
                />
                <StatCard
                    label="Total Users"
                    value={stats?.totalUsers || 0}
                    icon="👥" iconBg="bg-emerald-50/80" iconColor="text-emerald-600"
                    trend="1.2%" trendUp={false}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid xl:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart - Glassmorphism Container */}
                <div className="xl:col-span-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Revenue Analytics</h2>
                            <p className="text-sm text-gray-500 font-medium">Last 30 Days</p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff40" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                                formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Orders Chart - Glassmorphism Container */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Orders Volume</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff40" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                            />
                            <Bar dataKey="orders" fill="#A78BFA" radius={[6, 6, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders Table - Glassmorphism Container */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Recent Orders</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200/50">
                                <th className="text-left py-4 px-2 text-gray-500 font-medium">Order ID</th>
                                <th className="text-left py-4 px-2 text-gray-500 font-medium">Customer</th>
                                <th className="text-left py-4 px-2 text-gray-500 font-medium">Date</th>
                                <th className="text-left py-4 px-2 text-gray-500 font-medium">Amount</th>
                                <th className="text-left py-4 px-2 text-gray-500 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentOrders?.map((order) => (
                                <tr key={order._id} className="border-b border-gray-100/50 hover:bg-white/40 transition-colors">
                                    <td className="py-4 px-2 font-mono text-gray-500">#{order._id.slice(-8)}</td>
                                    <td className="py-4 px-2 font-semibold text-gray-700">{order.user?.name}</td>
                                    <td className="py-4 px-2 text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-2 font-bold text-gray-800">
                                        ₹{order.totalAmount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${order.status === 'delivered' ? 'bg-emerald-100/60 text-emerald-700' :
                                                order.status === 'shipped' ? 'bg-indigo-100/60 text-indigo-700' :
                                                    order.status === 'pending' ? 'bg-amber-100/60 text-amber-700' :
                                                        'bg-gray-100/60 text-gray-700'
                                            }`}>{order.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;