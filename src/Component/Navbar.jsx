import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [cashierInfo, setCashierInfo] = useState({
        counterNo: '01',
        name: 'John Doe'
    });
    const handleNavigation = (path) => {
        setActiveTab(path);
        if (path === 'logout') {
            // Handle logout logic here (e.g., clear tokens, redirect to login)
            console.log('User logged out');
            navigate('/login'); // Assuming a login route
        } else {
            navigate(`/${path}`);
        }
    };

    return (
        <nav className="bg-blue-600 shadow-lg ">
            <div className="container mx-auto px-4 sm:px-6 lg:px-2">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo and System Name */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="ml-3 text-white text-2xl font-bold tracking-tight">
                            Billing System
                        </span>
                    </div>

                    {/* Center Section - Navigation Links */}
                    <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                        <div className="hidden sm:block">
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => handleNavigation('home')}
                                    className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                    ${activeTab === 'home' ? 'bg-blue-500 text-white shadow-md' : 'text-white hover:bg-blue-500 hover:text-white'}`}
                                >
                                    Invoice
                                </button>
                                <button
                                    onClick={() => handleNavigation('sales')}
                                    className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                    ${activeTab === 'sales' ? 'bg-blue-500 text-white shadow-md' : 'text-white hover:bg-blue-500 hover:text-white'}`}
                                >
                                    Sales
                                </button>
                                <button
                                    onClick={() => handleNavigation('transactions')}
                                    className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                    ${activeTab === 'transactions' ? 'bg-blue-500 text-white shadow-md' : 'text-white hover:bg-blue-500 hover:text-white'}`}
                                >
                                    Transactions
                                </button>
                                <button
                                    onClick={() => handleNavigation('reports')}
                                    className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                    ${activeTab === 'reports' ? 'bg-blue-500 text-white shadow-md' : 'text-white hover:bg-blue-500 hover:text-white'}`}
                                >
                                    Reports
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Date, Time, Cashier Info, Logout */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
      


                        {/* Cashier Info */}
                        <div className="text-blue-100 text-sm mr-4 border-l border-blue-600 pl-4">

                            <div>Counter : <span className="font-semibold text-white">{cashierInfo.counterNo}</span></div>
                            <div>Cashier : <span className="font-semibold text-white">{cashierInfo.name}</span></div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => handleNavigation('logout')}
                            className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-red-700 transition-colors duration-200 shadow-md"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button (Hamburger) */}
                    <div className="-mr-2 flex sm:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon when menu is closed. */}
                            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            {/* Icon when menu is open. */}
                            <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state. */}
            {/* You would typically use a state variable to toggle this visibility */}
            <div className="sm:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <button
                        onClick={() => handleNavigation('home')}
                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
              ${activeTab === 'home' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-900 hover:text-white'}`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => handleNavigation('sales')}
                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
              ${activeTab === 'sales' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-900 hover:text-white'}`}
                    >
                        Sales
                    </button>
                    <button
                        onClick={() => handleNavigation('transactions')}
                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
              ${activeTab === 'transactions' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-900 hover:text-white'}`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => handleNavigation('reports')}
                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
              ${activeTab === 'reports' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-900 hover:text-white'}`}
                    >
                        Reports
                    </button>
                    <div className="border-t border-blue-600 pt-3 mt-3">
                        <div className="px-3 text-blue-100 text-sm">Counter: <span className="font-semibold">{cashierInfo.counterNo}</span></div>
                        <div className="px-3 text-blue-100 text-sm mb-2">Cashier : <span className="font-semibold">{cashierInfo.name}</span></div>
                        <button
                            onClick={() => handleNavigation('logout')}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 bg-red-700 hover:bg-red-800 transition-colors duration-200 mt-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;