import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Assuming logo is still imported if needed for a fallback or specific use,
// but company.logoUrl is preferred for dynamic display.
// import logo from '../assets/ATS LOGO WHITE (1).svg'; 

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine the active tab based on the current URL path
  const activeTab = location.pathname === '/' ? 'home' : location.pathname.slice(1).toLowerCase();
  
  // State to hold company information (name and logo URL)
  const [company, setCompany] = useState({ name: '', logoUrl: '' });

  // Fetch company details from the backend on component mount
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/companies');
        // If company data exists, set the state with the first company found
        if (res.data?.length > 0) {
          setCompany(res.data[0]);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Optionally, set a default company name if fetching fails
        setCompany(prev => ({ ...prev, businessName: 'Billing System' }));
      }
    };

    fetchCompany();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle user logout
  const handleLogout = () => {
    console.log('User logged out');
    // Navigate to the login page upon logout
    navigate('/login');
  };

  return (
    // Main navigation bar container with a dark, sleek background and subtle shadow
    <nav className="bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto"> {/* Added horizontal padding */}
        <div className="flex items-center justify-between h-14"> {/* Increased height slightly for better spacing */}
          {/* Left Section: Company Logo & Name */}
          <div className="flex items-center space-x-3">
            {company.logoUrl ? (
              // Display company logo if available
              <img
                src={`http://localhost:5000${company.logoUrl}`}
                alt="Company Logo"
                className="h-8 w-8 object-contain rounded-full" // Adjusted size for a cleaner look
              />
            ) : (
              // Fallback for logo if not loaded or available
              <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                ATS
              </div>
            )}
            {/* Company Business Name */}
            <span className="text-gray-100 text-lg font-semibold whitespace-nowrap">
              {company.businessName || 'Loading...'}
            </span>
          </div>

          {/* Center Section: Navigation Links */}
          <div className="flex-1 flex justify-center">
            <div className="flex space-x-1"> {/* Reduced space between links */}
              {[
                { path: '/', label: 'Invoice', key: 'home' },
                { path: '/sales', label: 'Sales', key: 'sales' },
                { path: '/transactions', label: 'Transactions', key: 'transactions' },
                { path: '/reports', label: 'Reports', key: 'reports' }
              ].map(({ path, label, key }) => (
                <Link
                  key={key}
                  to={path}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${activeTab === key
                      ? 'bg-blue-600 text-white shadow-md' // Professional active state with a subtle indigo
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white' // Subtle hover for inactive links
                    }
                  `}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section: Logout Button */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 transition-colors" // Adjusted padding and shadow
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Adjusted icon size and margin */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;