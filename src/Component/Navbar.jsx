import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BarChart2, Search, Package, Plus, ShoppingCart, User, Phone, Pause, Printer, CreditCard, LogOut // Lucide React Icons
} from 'lucide-react'; // Import icons for a professional look
import Api from '../services/api';

// Accept new props for shortcut actions as refs
const Navbar = ({
  onFocusProductSearch,
  onFocusProductCode,
  onFocusQuantity,
  onTriggerAddProduct,
  onFocusCustomerName,
  onFocusPhoneNumber,
  onTriggerHold,
  onTriggerPrint,
  onTriggerPayment,
}) => {
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
        setCompany(prev => ({ ...prev, name: 'Billing System' }));
      }
    };
    fetchCompany();
  }, []);

  const handleLogout = useCallback(() => {
    console.log('User logged out');
    navigate('/login');
  }, [navigate]);

  // --- Shortcut Action Handlers (for both clicks and keyboard) ---
  const handleShortcutAction = useCallback((action) => {
    console.log(`Shortcut Action: ${action}`);

    // Only allow product/customer/bill actions if on the billing system page ('/')
    const isOnBillingPage = location.pathname === '/';

    switch (action) {
      case 'invoice':
        navigate('/');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'searchProduct':
        if (isOnBillingPage && onFocusProductSearch.current) {
          onFocusProductSearch.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F1 (Search Product) only works on Invoice page.');
          // Optionally, show a toast message to the user
          // toast.info('Please navigate to the Invoice page (Ctrl+1) to use this shortcut.');
        }
        break;
      case 'productCode':
        if (isOnBillingPage && onFocusProductCode.current) {
          onFocusProductCode.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F2 (Product Code) only works on Invoice page.');
        }
        break;
      case 'quantity':
        if (isOnBillingPage && onFocusQuantity.current) {
          onFocusQuantity.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F3 (Quantity) only works on Invoice page.');
        }
        break;
      case 'addProduct':
        if (isOnBillingPage && onTriggerAddProduct.current) {
          onTriggerAddProduct.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F4 (Add Product) only works on Invoice page.');
        }
        break;
      case 'customerName':
        if (isOnBillingPage && onFocusCustomerName.current) {
          onFocusCustomerName.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F5 (Customer Name) only works on Invoice page.');
        }
        break;
      case 'phoneNumber':
        if (isOnBillingPage && onFocusPhoneNumber.current) {
          onFocusPhoneNumber.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F6 (Phone Number) only works on Invoice page.');
        }
        break;
      case 'hold':
        if (isOnBillingPage && onTriggerHold.current) {
          onTriggerHold.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F7 (Hold) only works on Invoice page.');
        }
        break;
      case 'print':
        if (isOnBillingPage && onTriggerPrint.current) {
          onTriggerPrint.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F8 (Print) only works on Invoice page.');
        }
        break;
      case 'payment':
        if (isOnBillingPage && onTriggerPayment.current) {
          onTriggerPayment.current();
        } else if (!isOnBillingPage) {
          console.warn('Shortcut F9 (Payment) only works on Invoice page.');
        }
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  }, [
    location.pathname, navigate, handleLogout,
    onFocusProductSearch, onFocusProductCode, onFocusQuantity,
    onTriggerAddProduct, onFocusCustomerName, onFocusPhoneNumber,
    onTriggerHold, onTriggerPrint, onTriggerPayment
  ]);

  const handleKeyDown = useCallback((event) => {
    if (event.ctrlKey) {
      switch (event.key) {
        case 'l':
          event.preventDefault();
          handleShortcutAction('logout');
          break;
        case 'r':
          event.preventDefault();
          handleShortcutAction('reports');
          break;
        case '1': // Ctrl+1 for Invoice
          event.preventDefault();
          handleShortcutAction('invoice');
          break;
        default:
          break;
      }
    } else if (event.key.startsWith('F')) {
      switch (event.key) {
        case 'F1': event.preventDefault(); handleShortcutAction('searchProduct'); break;
        case 'F2': event.preventDefault(); handleShortcutAction('productCode'); break;
        case 'F3': event.preventDefault(); handleShortcutAction('quantity'); break;
        case 'F4': event.preventDefault(); handleShortcutAction('addProduct'); break;
        case 'F5': event.preventDefault(); handleShortcutAction('customerName'); break;
        case 'F6': event.preventDefault(); handleShortcutAction('phoneNumber'); break;
        case 'F7': event.preventDefault(); handleShortcutAction('hold'); break;
        case 'F8': event.preventDefault(); handleShortcutAction('print'); break;
        case 'F9': event.preventDefault(); handleShortcutAction('payment'); break;
        default: break;
      }
    }
  }, [handleShortcutAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const shortcutButtons = [
    { label: 'Invoice', shortcut: 'Ctrl+1', action: 'invoice', path: '/', icon: Home },
    { label: 'Reports', shortcut: 'Ctrl+R', action: 'reports', path: '/reports', icon: BarChart2 },
    { label: 'Search', shortcut: 'F1', action: 'searchProduct', icon: Search },
    { label: 'Code', shortcut: 'F2', action: 'productCode', icon: Package },
    { label: 'Quantity', shortcut: 'F3', action: 'quantity', icon: Plus },
    { label: 'Add', shortcut: 'F4', action: 'addProduct', icon: ShoppingCart },
    { label: 'Name', shortcut: 'F5', action: 'customerName', icon: User },
    { label: 'Phone', shortcut: 'F6', action: 'phoneNumber', icon: Phone },
    { label: 'Hold', shortcut: 'F7', action: 'hold', icon: Pause },
    { label: 'Print', shortcut: 'F8', action: 'print', icon: Printer },
    { label: 'Payment', shortcut: 'F9', action: 'payment', icon: CreditCard },
    { label: 'Logout', shortcut: 'Ctrl+L', action: 'logout', icon: LogOut },
  ];

  return (
    <nav className="bg-gray-800 z-50  fixed bottom-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Company Logo and Name */}
          {/* <div className="flex items-center">
            {company.logoUrl && (
              <img className="h-8 w-8 mr-2 rounded-full object-cover" src={company.logoUrl} alt={`${company.name} Logo`} />
            )}
            <span className="text-white text-xl font-bold tracking-wide">
              {company.name || 'Billing System'}
            </span>
          </div> */}

          {/* All Shortcut Buttons */}
          <div className="flex-1 flex justify-center">
            <div className="grid grid-cols-12 gap-x-16 gap-y-2"> {/* Adjusted gap for better spacing */}
              {shortcutButtons.map((item) => (
                <button
                  key={item.action}
                  onClick={() => handleShortcutAction(item.action)}
                  className={`
                    px-4 py-2 text-sm font-medium 
                    flex flex-col items-center justify-center text-center group
                    border border-transparent
                    ${(item.action === 'invoice' && activeTab === 'home') || (item.action === 'reports' && activeTab === 'reports')
                      ? ' text-white '
                      : 'text-gray-300  hover:text-white'
                    }                    
                  `}
                >
                  <div className="flex items-center space-x-1"> {/* Container for icon and label */}

                    <span className='text-sm'>{item.label}</span>
                  </div>
                  <span className="text-xs mt-0.5 opacity-75 group-hover:opacity-100">{item.shortcut}</span> {/* Shortcut always visible, slightly more prominent on hover */}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
