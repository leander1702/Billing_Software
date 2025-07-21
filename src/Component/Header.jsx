import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Api from '../services/api';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname === '/' ? 'home' : location.pathname.slice(1).toLowerCase();

    const [company, setCompany] = useState({ name: '', logoUrl: '' });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await Api.get('/companies');
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
        <nav className="bg-blue-600 shadow-lg  w-full">
            <div className="container mx-auto">
                <div className="flex justify-center h-6 items-center ">
                    {/* Logo and System Name */}
                    <div className="flex items-center">                       
                        <span className="text-gray-100 text-sm font-semibold whitespace-nowrap uppercase">
                            {company.businessName || 'Loading...'}
                        </span>
                    </div>
                    {/* Right Section - Cashier Info & Logout */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">                       
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
