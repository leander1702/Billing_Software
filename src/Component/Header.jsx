import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname === '/' ? 'home' : location.pathname.slice(1).toLowerCase();

    const [company, setCompany] = useState({ name: '', logoUrl: '' });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/companies');
                if (res.data?.length > 0) {
                    setCompany(res.data[0]);
                }
            } catch (error) {
                console.error('Error fetching company info:', error);
                setCompany(prev => ({ ...prev, businessName: 'Billing System' }));
            }
        };

        fetchCompany();
    }, []);

    return (
        <nav className="bg-blue-600 shadow-lg">
            <div className="container mx-auto">
                <div className="flex justify-center h-6 items-center ">

                    {/* Logo and System Name */}
                    <div className="flex items-center">
                        {/* {company.logoUrl ? (
                            <img
                                src={`http://localhost:5000${company.logoUrl}`}
                                alt="Company Logo"
                                className="h-5 w-5 object-contain rounded-full"
                            />
                        ) : (
                            <div className="h-5 w-5 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                ATS
                            </div>
                        )} */}
                        <span className="text-gray-100 text-sm font-semibold whitespace-nowrap uppercase">
                            {company.businessName || 'Loading...'}
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
                        {/* <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-1 rounded-sm text-sm font-medium text-white bg-red-700 transition-colors duration-200 shadow-md"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button> */}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
