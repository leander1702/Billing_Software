import React, { useEffect, useState } from 'react';
import Sales from './Sales';
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
import Api from '../services/api';

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

  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] });
  const [transactionChartData, setTransactionChartData] = useState({ labels: [], datasets: [] });

 useEffect(() => {
  Api.get('/bills')
    .then((response) => {
      const data = response.data;
      setBills(data);
      calculateMetrics(data);
      processChartData(data);
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

  const processChartData = (billsData) => {
    // --- Sales Overview (Bar Chart) Data Processing for Last 12 Months ---
    const salesByMonthMap = new Map(); // Use a Map to maintain insertion order for months

    // Calculate dates for the last 12 months, including the current month
    const today = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = [];
    const salesValues = [];

    // Initialize sales for the last 12 months to 0
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
      const monthYearKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      labels.push(monthYearKey);
      salesByMonthMap.set(monthYearKey, 0);
    }

    // Populate sales data from bills, only for the last 12 months
    billsData.forEach(bill => {
      const billDate = new Date(bill.date);
      // Ensure bill date is within the last 12 months (inclusive of current month)
      const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      if (billDate >= twelveMonthsAgo && billDate <= today) {
        const monthYearKey = `${monthNames[billDate.getMonth()]} ${billDate.getFullYear()}`;
        if (salesByMonthMap.has(monthYearKey)) { // Only add if it's one of the 12 months we're tracking
          salesByMonthMap.set(monthYearKey, salesByMonthMap.get(monthYearKey) + (bill.total || 0));
        }
      }
    });

    // Extract values in the order of labels
    labels.forEach(label => salesValues.push(salesByMonthMap.get(label)));

    // Find highest and lowest sales, excluding months with 0 sales for comparison
    const nonZeroSales = salesValues.filter(value => value > 0);
    const maxSale = nonZeroSales.length > 0 ? Math.max(...nonZeroSales) : 0;
    const minSale = nonZeroSales.length > 0 ? Math.min(...nonZeroSales) : 0;

    const backgroundColors = salesValues.map(value => {
      if (value === maxSale && maxSale > 0) {
        return 'rgba(46, 204, 113, 0.9)'; // Green for highest
      } else if (value === minSale && minSale > 0) {
        return 'rgba(231, 76, 60, 0.9)'; // Red for lowest
      } else {
        return 'rgba(52, 152, 219, 0.6)'; // Blue for medium
      }
    });

    const borderColors = salesValues.map(value => {
      if (value === maxSale && maxSale > 0) {
        return 'rgba(39, 174, 96, 1)'; // Green border
      } else if (value === minSale && minSale > 0) {
        return 'rgba(192, 57, 43, 1)'; // Red border
      } else {
        return 'rgba(41, 128, 185, 1)'; // Blue border
      }
    });


    setSalesChartData({
      labels: labels,
      datasets: [
        {
          label: 'Sales (₹)',
          data: salesValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    });

    // --- Transaction Overview (Line Chart) Data Processing ---
    const transactionsByDay = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };

    billsData.forEach(bill => {
      const billDate = new Date(bill.date);
      const dayOfWeek = billDate.toLocaleString('en-US', { weekday: 'long' });
      if (transactionsByDay.hasOwnProperty(dayOfWeek)) {
        transactionsByDay[dayOfWeek]++;
      }
    });

    const orderedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    setTransactionChartData({
      labels: orderedDays,
      datasets: [
        {
          label: 'Transactions',
          data: orderedDays.map(day => transactionsByDay[day]),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        },
      ],
    });
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
            <h1 className="text-lg font-semibold text-gray-800">Sales Analytics Report</h1>
            <p className="text-gray-600 text-sm">Comprehensive overview of your business performance</p>
          </div>
          <div className="flex items-center space-x-3">
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
              <MetricCard
                title="Total Revenue"
                value={`₹${totalRevenue.toFixed(2)}`}
                subtitle="All time sales"
                icon={<FiDollarSign className="text-blue-600 text-xl" />}
                iconBg="bg-blue-100"
              />

              <MetricCard
                title="Total Transactions"
                value={totalTransactions}
                subtitle="Completed orders"
                icon={<FiShoppingCart className="text-green-600 text-xl" />}
                iconBg="bg-green-100"
              />

              <MetricCard
                title="Avg. Order Value"
                value={`₹${averageOrderValue.toFixed(2)}`}
                subtitle="Per transaction"
                icon={<FiTrendingUp className="text-purple-600 text-xl" />}
                iconBg="bg-purple-100"
              />

              <MetricCard
                title="Unique Customers"
                value={uniqueCustomers}
                subtitle="Total customers"
                icon={<FiUsers className="text-orange-600 text-xl" />}
                iconBg="bg-orange-100"
              />
            </div>
            <Sales />
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
              <ChartCard
                title="Sales Overview"
                subtitle="Last 12 Months Sales Trend (Highest/Lowest Highlighted)" // Updated subtitle
                icon={<FiCalendar />}
                chart={<Bar data={salesChartData} options={chartOptions} />}
              />
              <ChartCard
                title="Transaction Overview"
                subtitle="Transactions by Day of Week"
                icon={<FiCalendar />}
                chart={<Line data={transactionChartData} options={chartOptions} />}
              />             
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Reusable metric card (No changes needed)
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

// Reusable chart card (No changes needed)
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

// Common chart options (Tooltip callback updated for currency)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
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