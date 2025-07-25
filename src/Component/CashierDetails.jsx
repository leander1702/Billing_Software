// CashierDetails.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CashierDetails = () => {
  const [cashier, setCashier] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    loadCashierData();
    return () => clearInterval(timer);
  }, []);

  const loadCashierData = () => {
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (userData) {
      setCashier({
        cashierId: userData.cashierId,
        cashierName: userData.cashierName,
        counterNum: userData.counterNum,
        contactNumber: userData.contactNumber
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCashier(null);
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formatTime = (date) => date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="bg-white p-2 border border-gray-200 shadow-sm relative">
      {/* Counter number badge */}
      {cashier?.counterNum && (
        <div className="absolute top-0 right-0 bg-green-600 text-white px-1.5 py-0.5 text-xs font-bold rounded-bl-md">
          Counter No: {cashier.counterNum}
        </div>
      )}

      {/* Date and Time */}
      <div className="mb-1">
        <p className="text-xs font-medium text-gray-700">
          {formatDate(currentDateTime)} • {formatTime(currentDateTime)}
        </p>
      </div>

      {cashier ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-0.5">Cashier ID</p>
            <p className="text-xs font-medium text-gray-800">{cashier.cashierId}</p>
          </div>

          <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-0.5">Name</p>
            <p className="text-xs font-medium text-gray-800">{cashier.cashierName}</p>
          </div>

          <div className="col-span-2">
            <button 
              onClick={handleLogout}
              className="w-full mt-2 py-1 px-2 bg-red-50 text-red-600 text-xs font-medium rounded border border-red-100 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-1 text-xs font-medium">No cashier data</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-2 py-1 px-3 bg-blue-50 text-blue-600 text-xs font-medium rounded border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            Login Now
          </button>
        </div>
      )}
    </div>
  );
};

export default CashierDetails;