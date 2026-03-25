import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import API from '../../utils/api';
import Loading from '../../components/2d/common/Loading';

const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

function AdminAnalytics() {
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [orderStats, setOrderStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30'); // days

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [salesRes, topRes, dashRes] = await Promise.all([
                API.get(`/admin/analytics/sales?period=${period}`),
                API.get('/admin/analytics/top-products'),
                API.get('/admin/dashboard'),
            ]);

            // Format sales data for chart
            const formatted = salesRes.data.map(d => ({
                date: `${d._id.month}/${d._id.day}`,
                revenue: parseFloat(d.total.toFixed(2)),
                orders: d.count,
            }));
            setSalesData(formatted);

            // Format top products
            setTopProducts(topRes.data.slice(0, 5));

            // Format order status breakdown for pie chart
            const statusData = dashRes.data.ordersByStatus.map(s => ({
                name: s._id,
                value: s.count,
            }));
            setOrderStats(statusData);

        } catch (err) {
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary totals from sales data
    const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    if (loading) return <Loading />;

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Analytics</h1>

                {/* Period Selector */}
                <div className="flex gap-2">
                    {[
                        { label: '7 Days', value: '7' },
                        { label: '30 Days', value: '30' },
                        { label: '90 Days', value: '90' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${period === opt.value
                                    ? 'bg-purple-700 text-white'
                                    : 'bg-white border hover:border-purple-500'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                    <p className="text-gray-500 text-sm">Revenue (last {period} days)</p>
                    <p className="text-3xl font-bold mt-1">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm">Orders (last {period} days)</p>
                    <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm">Avg Order Value</p>
                    <p className="text-3xl font-bold mt-1">₹{avgOrderValue}</p>
                </div>
            </div>

            {/* Revenue Line Chart */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-6">Revenue Over Time</h2>
                {salesData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No sales data for this period yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#7C3AED"
                                strokeWidth={2}
                                dot={false}
                                name="Revenue ($)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Orders Bar Chart */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-6">Orders Per Day</h2>
                {salesData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No order data for this period yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="orders"
                                fill="#6B21A8"
                                radius={[4, 4, 0, 0]}
                                name="Orders"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Bottom Row: Top Products + Order Status Pie */}
            <div className="grid xl:grid-cols-2 gap-6">

                {/* Top Selling Products */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Top Selling Products</h2>
                    {topProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No sales data yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    {/* Rank */}
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-orange-400' :
                                                    'bg-purple-300'
                                        }`}>
                                        {index + 1}
                                    </span>

                                    {/* Product Image */}
                                    {item._id?.images?.[0] && (
                                        <img
                                            src={item._id.images[0]}
                                            alt=""
                                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        />
                                    )}

                                    {/* Product Info */}
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold truncate">
                                            {item._id?.name || 'Unknown Product'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {item.totalSold} units sold
                                        </p>
                                    </div>

                                    {/* Revenue */}
                                    <p className="font-bold text-purple-700 flex-shrink-0">
                                        ₹{item.revenue?.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Order Status Breakdown Pie */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Order Status Breakdown</h2>
                    {orderStats.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No orders yet.
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={orderStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {orderStats.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {orderStats.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm capitalize text-gray-600">
                                            {entry.name}
                                        </span>
                                        <span className="text-sm font-bold ml-auto">
                                            {entry.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminAnalytics;