import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiDownload,
} from 'react-icons/fi';

ChartJS.register(
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const Reports = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/api/bills')
      .then((res) => res.json())
      .then((data) => {
        setBills(data);
        calculateMetrics(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching bills:', err);
        setIsLoading(false);
      });
  }, []);

  const calculateMetrics = (billsData) => {
    const revenue = billsData.reduce((sum, bill) => sum + (bill.total || 0), 0);
    setTotalRevenue(revenue);
    setTotalTransactions(billsData.length);
    setAverageOrderValue(revenue / (billsData.length || 1));
    const unique = new Set(billsData.map((bill) => bill.customer?.id).filter(Boolean));
    setUniqueCustomers(unique.size);
  };

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Sales',
        data: [12000, 19000, 15000, 21000, 18000, 24000, 28000],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const transactionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Transactions',
        data: [12, 19, 15, 21, 18, 24, 28],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const productDistributionData = {
    labels: ['Electronics', 'Clothing', 'Groceries', 'Home Goods', 'Others'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(156, 163, 175, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sales Analytics Report</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview of your business performance</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="quarter">This quarter</option>
              <option value="year">This year</option>
            </select>
            <button className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
              <FiDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Revenue */}
              <MetricCard
                title="Total Revenue"
                value={`₹${totalRevenue.toFixed(2)}`}
                subtitle="All time sales"
                icon={<FiDollarSign className="text-blue-600 text-xl" />}
                iconBg="bg-blue-100"
              />

              {/* Transactions */}
              <MetricCard
                title="Total Transactions"
                value={totalTransactions}
                subtitle="Completed orders"
                icon={<FiShoppingCart className="text-green-600 text-xl" />}
                iconBg="bg-green-100"
              />

              {/* Avg Order */}
              <MetricCard
                title="Avg. Order Value"
                value={`₹${averageOrderValue.toFixed(2)}`}
                subtitle="Per transaction"
                icon={<FiTrendingUp className="text-purple-600 text-xl" />}
                iconBg="bg-purple-100"
              />

              {/* Customers */}
              <MetricCard
                title="Unique Customers"
                value={uniqueCustomers}
                subtitle="Total customers"
                icon={<FiUsers className="text-orange-600 text-xl" />}
                iconBg="bg-orange-100"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard title="Sales Overview" subtitle="Last 7 months" icon={<FiCalendar />} chart={<Bar data={salesData} options={chartOptions} />} />
              <ChartCard title="Transaction Overview" subtitle="Last 7 days" icon={<FiCalendar />} chart={<Line data={transactionData} options={chartOptions} />} />
            </div>

            {/* Pie + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-1">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Distribution</h2>
                <div className="h-64">
                  <Pie
                    data={productDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {bills.length === 0 && (
                    <p className="text-center text-gray-500">No recent activity.</p>
                  )}
                  {bills.slice(0, 5).map((bill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-4">
                          <FiShoppingCart className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order #{bill.id}</p>
                          <p className="text-xs text-gray-500">
                            {bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A'} • {bill.products?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">₹{(bill.total ?? 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                {bills.length > 5 && (
                  <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View all activity →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Reusable metric card
const MetricCard = ({ title, value, subtitle, icon, iconBg }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

// Reusable chart card
const ChartCard = ({ title, subtitle, icon, chart }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center text-sm text-gray-500">
        {icon}
        <span className="ml-1">{subtitle}</span>
      </div>
    </div>
    <div className="h-80">{chart}</div>
  </div>
);

// Common chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { drawBorder: false },
    },
    x: {
      grid: { display: false },
    },
  },
};

export default Reports;
