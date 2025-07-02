import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/ATS LOGO WHITE (1).svg';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [cashierInfo, setCashierInfo] = useState({ counterNo: '', name: '' });

    const activeTab = location.pathname === '/' ? 'home' : location.pathname.slice(1);

    useEffect(() => {
        const fetchCashierInfo = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/credentials/users");
                if (res.data && res.data.length > 0) {
                    setCashierInfo(res.data[0]); // Use the first user
                }
            } catch (error) {
                console.error("Failed to fetch cashier info:", error);
            }
        };

        fetchCashierInfo();
    }, []);

    const handleLogout = () => {
        console.log('User logged out');
        navigate('/login');
    };

    return (
        <nav className="bg-[#248AFD] shadow-lg">
            <div className="container mx-auto">
                <div className="flex justify-between h-11 items-center py-5">
                    
                    {/* Logo and System Name */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <img src={logo} alt="Logo" className="h-6 w-6" />
                        </div>
                        <span className="ml-3 text-white text-base font-semibold tracking-tight">
                            Billing System
                        </span>
                    </div>

                    {/* Right Section - Cashier Info & Logout */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">

                        {/* Cashier Info */}
                        {/* <div className="text-blue-100 text-xs mr-4 border-l border-blue-600 pl-4">
                            <div>Counter : <span className="font-semibold text-white">{cashierInfo.counterNum || '-'}</span></div>
                            <div>Cashier : <span className="font-semibold text-white">{cashierInfo.cashierName || '-'}</span></div>
                        </div> */}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-1 rounded-sm text-sm font-medium text-white bg-red-700 transition-colors duration-200 shadow-md"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
