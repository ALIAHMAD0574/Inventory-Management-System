import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Calendar } from 'lucide-react';

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('day');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => ordersApi.getAnalytics(period),
  });

  const stats = React.useMemo(() => {
    if (!analyticsData) return { totalRevenue: 0, totalProfit: 0, totalCogs: 0 };
    return analyticsData.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + Number(curr.total_revenue),
      totalProfit: acc.totalProfit + Number(curr.total_profit),
      totalCogs: acc.totalCogs + Number(curr.total_cogs),
    }), { totalRevenue: 0, totalProfit: 0, totalCogs: 0 });
  }, [analyticsData]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (period === 'day') return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (period === 'week') return `Week ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    if (period === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    if (period === 'year') return date.getFullYear().toString();
    return tickItem;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Financial Analytics</h2>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-100">
          {['day', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                period === p 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg mr-4">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">Rs. {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className={`p-3 rounded-lg mr-4 ${stats.totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            {stats.totalProfit >= 0 ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Net Profit/Loss</p>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {stats.totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg mr-4">
            <PieChartIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cost of Goods</p>
            <p className="text-2xl font-bold text-gray-900">Rs. {stats.totalCogs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue vs Profit</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`]}
                />
                <Legend />
                <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Profit Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_profit" 
                  name="Net Profit" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Cost Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`]}
              />
              <Legend />
              <Line type="monotone" dataKey="total_revenue" name="Total Sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="total_cogs" name="Total Cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
