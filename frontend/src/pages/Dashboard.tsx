import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../api/core';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: coreApi.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg font-medium text-gray-500 text-center py-20">Loading dashboard data...</div>
      </div>
    );
  }

  const stats = [
    { name: 'Total Products', value: statsData?.total_products?.toLocaleString() || '0', icon: Package, color: 'bg-blue-500', trend: '+0%', trendUp: true, path: '/products' },
    { name: 'Purchase Orders', value: statsData?.total_purchase_orders?.toLocaleString() || '0', icon: ShoppingCart, color: 'bg-green-500', trend: '+0%', trendUp: true, path: '/purchase-orders' },
    { name: 'Sales Orders', value: statsData?.total_sales_orders?.toLocaleString() || '0', icon: Truck, color: 'bg-purple-500', trend: '+0%', trendUp: true, path: '/sales-orders' },
    { name: 'Total Stock Items', value: statsData?.total_stock_quantity?.toLocaleString() || '0', icon: ArrowLeftRight, color: 'bg-amber-500', trend: '+0%', trendUp: true, path: '/stock' },
  ];

  const chartData = statsData?.chart_data || [];
  const recentOrders = statsData?.recent_orders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.first_name || user?.username}!</h2>
        <div className="flex space-x-2">
          {statsData?.low_stock_count > 0 && (
            <span 
              onClick={() => navigate('/stock')}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 cursor-pointer hover:bg-red-200 transition-colors"
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              {statsData.low_stock_count} Low Stock Alerts
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 text-${stat.color.split('-')[1]}-600`} />
              </div>
              <span className={`inline-flex items-center text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trendUp ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Sales vs Purchases</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#0ea5e9" name="Sales" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchase" fill="#10b981" name="Purchases" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Inventory Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <button 
            onClick={() => navigate('/sales-orders')}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View All
          </button>
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
          {Array.isArray(recentOrders) && recentOrders.map((order) => (
            <div key={order.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                  order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{order.entity}</span>
                <span className="text-gray-900 font-bold">Rs. {order.amount.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-500">{order.date}</p>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.isArray(recentOrders) && recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.entity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">Rs. {order.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
