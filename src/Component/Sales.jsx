import React, { useEffect, useState } from 'react';
import Api from '../services/api';

const Sales = () => {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totalCustomersBilled, setTotalCustomersBilled] = useState(0);
    const [mostSoldProductData, setMostSoldProductData] = useState({
        day: null,
        week: null,
        month: null,
        year: null,
    });
    const [selectedProductPeriod, setSelectedProductPeriod] = useState('day'); // State for product dropdown selection
    const [selectedCustomerPeriod, setSelectedCustomerPeriod] = useState('all'); // State for customer bills filter
    const [filteredBills, setFilteredBills] = useState([]); // State for filtered bills in the table
    const [totalTransactionAmounts, setTotalTransactionAmounts] = useState({ // New state for total transaction amounts
        allTime: 0,
        day: 0,
        week: 0,
        month: 0,
        year: 0,
    });

  useEffect(() => {
    // console.log("Fetching bills..."); // Debugging: Confirm useEffect runs
    Api.get('/bills')
        .then(response => {
            const data = response.data;
            // console.log("Bills fetched:", data); // Debugging: See fetched data
            setBills(data);
            setIsLoading(false);
            calculateSalesData(data);
            calculateTotalTransactionAmounts(data);
        })
        .catch(err => {
            console.error('Error fetching bills:', err);
            setIsLoading(false);
            setBills([]); // Fallback to empty array on error
        });
}, []);

    useEffect(() => {
        // console.log("Customer period or bills changed. Filtering bills..."); // Debugging filter effect
        filterBillsByCustomerPeriod(selectedCustomerPeriod, bills);
    }, [selectedCustomerPeriod, bills]);

    const calculateSalesData = (billsData) => {
        // Calculate total unique customers billed
        const uniqueCustomerIds = new Set();
        billsData.forEach(bill => uniqueCustomerIds.add(bill.customer.id));
        setTotalCustomersBilled(uniqueCustomerIds.size);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as the start of the week

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const productSalesDay = {};
        const productSalesWeek = {};
        const productSalesMonth = {};
        const productSalesYear = {};

        billsData.forEach(bill => {
            const billDate = new Date(bill.date);
            billDate.setHours(0, 0, 0, 0); // Normalize bill date to start of day

            // Daily
            if (billDate.getTime() === today.getTime()) {
                bill.products.forEach(product => {
                    productSalesDay[product.name] = (productSalesDay[product.name] || 0) + product.quantity;
                });
            }
            // Weekly
            if (billDate >= startOfWeek) {
                bill.products.forEach(product => {
                    productSalesWeek[product.name] = (productSalesWeek[product.name] || 0) + product.quantity;
                });
            }
            // Monthly
            if (billDate >= startOfMonth) {
                bill.products.forEach(product => {
                    productSalesMonth[product.name] = (productSalesMonth[product.name] || 0) + product.quantity;
                });
            }
            // Yearly
            if (billDate >= startOfYear) {
                bill.products.forEach(product => {
                    productSalesYear[product.name] = (productSalesYear[product.name] || 0) + product.quantity;
                });
            }
        });

        setMostSoldProductData({
            day: getMostSoldProduct(productSalesDay),
            week: getMostSoldProduct(productSalesWeek),
            month: getMostSoldProduct(productSalesMonth),
            year: getMostSoldProduct(productSalesYear),
        });
    };

    const calculateTotalTransactionAmounts = (billsData) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        let allTimeTotal = 0;
        let dayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;
        let yearTotal = 0;

        billsData.forEach(bill => {
            const billDate = new Date(bill.date);
            billDate.setHours(0, 0, 0, 0);

            allTimeTotal += bill.total;

            if (billDate.getTime() === today.getTime()) {
                dayTotal += bill.total;
            }
            if (billDate >= startOfWeek) {
                weekTotal += bill.total;
            }
            if (billDate >= startOfMonth) {
                monthTotal += bill.total;
            }
            if (billDate >= startOfYear) {
                yearTotal += bill.total;
            }
        });

        setTotalTransactionAmounts({
            allTime: allTimeTotal,
            day: dayTotal,
            week: weekTotal,
            month: monthTotal,
            year: yearTotal,
        });
    };

    const getMostSoldProduct = (productSales) => {
        let mostSold = null;
        let maxQuantity = 0;

        for (const productName in productSales) {
            if (productSales[productName] > maxQuantity) {
                maxQuantity = productSales[productName];
                mostSold = { name: productName, quantity: maxQuantity };
            }
        }
        return mostSold;
    };

    const filterBillsByCustomerPeriod = (period, allBills) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date

        let startDate = null;

        switch (period) {
            case 'day':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            case 'week':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); // Start of the current week (Sunday)
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            case 'all':
            default:
                setFilteredBills(allBills);
                return;
        }

        const filtered = allBills.filter(bill => {
            const billDate = new Date(bill.date);
            billDate.setHours(0, 0, 0, 0); // Normalize bill date

            return billDate >= startDate;
        });
        setFilteredBills(filtered);
    };

    const openProductDetails = (bill) => {
        // console.log("Attempting to open modal for bill:", bill); // Debugging: confirm function call
        setSelectedBill(bill);
        setIsModalOpen(true);
        // console.log("Modal open state set to:", true); // Debugging: confirm state update
    };

    const closeModal = () => {
        // console.log("Closing modal."); // Debugging: confirm close
        setIsModalOpen(false);
        setSelectedBill(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen font-inter "> 
            <div className="max-w-7xl mx-auto">             
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                        <p className="ml-3 text-gray-600">Loading sales data...</p>
                    </div>
                ) : (
                    <>
                        {/* Sales Summary Cards */}
                        <div className="grid grid-cols-1 gap-6 mb-8">                          
                           {/* Most Sold Product Card */}
                            <div className="bg-white rounded-lg shadow-sm p-5 border border-green-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base font-semibold text-red-700">Most Sold Product</h3>
                                    <select
                                        value={selectedProductPeriod}
                                        onChange={(e) => setSelectedProductPeriod(e.target.value)}
                                        className="block w-auto px-3 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                                    >
                                        <option value="day">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2 ">
                                    {mostSoldProductData[selectedProductPeriod] ? (
                                        <>
                                            <span className="text-lg font-bold text-gray-900">{mostSoldProductData[selectedProductPeriod].name}</span>
                                            <span className="text-base text-gray-600">({mostSoldProductData[selectedProductPeriod].quantity} units)</span>
                                        </>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No sales data for this period.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Customer Bills Table */}
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-semibold text-black">Recent Customer Bills</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Filter by:</span>
                                <select
                                    value={selectedCustomerPeriod}
                                    onChange={(e) => setSelectedCustomerPeriod(e.target.value)}
                                    className="block w-auto px-3 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                                >
                                    <option value="all">All Time</option>
                                    <option value="day">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                        </div>

                        {filteredBills.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-3 text-lg font-medium text-gray-900">No customer bills found</h3>
                                <p className="mt-1 text-gray-600">Try adjusting your filter or add new sales.</p>
                            </div>
                        ) : (
                            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Items
                                                </th>
                                                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredBills.map((bill) => (
                                                <tr key={bill.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-medium text-sm">{bill.customer.name.charAt(0)}</span>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{bill.customer.name}</div>
                                                                <div className="text-xs text-gray-500">ID: {bill.customer.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {bill.customer.contact}
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {bill.products.length} items
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(bill.date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-semibold">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            ₹ {bill.total.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openProductDetails(bill)}
                                                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Product Details Modal */}
                {isModalOpen && selectedBill && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"> {/* Removed animation classes temporarily */}
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"> {/* Removed animation classes temporarily */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Bill ID: <span className="font-semibold text-gray-800">{selectedBill.id}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            Date: <span className="font-semibold text-gray-800">{new Date(selectedBill.date).toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-700 mb-2">Customer Info</h4>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-base font-bold text-gray-900 mb-0.5">{selectedBill.customer.name}</p>
                                            <p className="text-sm text-gray-700">ID: <span className="font-medium">{selectedBill.customer.id}</span></p>
                                            <p className="text-sm text-gray-700">Contact: <span className="font-medium">{selectedBill.customer.contact}</span></p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-base font-semibold text-gray-700 mb-2">Order Summary</h4>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-center py-0.5">
                                                <span className="text-sm text-gray-700">Subtotal:</span>
                                                <span className="text-sm font-bold text-gray-900">₹ {selectedBill.total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                                <span className="text-sm text-gray-700">Total Items:</span>
                                                <span className="text-sm font-bold text-gray-900">{selectedBill.products.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-base font-semibold text-gray-700 mb-2">Products Purchased</h4>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedBill.products.map((product, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">₹ {product.price.toFixed(2)}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{product.quantity}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                                            ₹ {(product.price * product.quantity).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sales;