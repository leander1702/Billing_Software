// src/components/CashierDetails.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Api from '../services/api';

const CashierDetails = () => {
  const [cashier, setCashier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCashier = async () => {
      try {
        const res = await Api.get("/credentials/users");
        if (res.data.length > 0) {
          setCashier(res.data[0]); // Assuming the first user is the cashier
        }
      } catch (error) {
        console.error("Error fetching cashier details:", error);
        toast.error("Failed to fetch cashier details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCashier();
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  return (
    <div className="bg-white p-4 border border-gray-200  shadow-sm relative">
      {/* Counter number badge */}
      {cashier?.counterNum && (
        <div className="absolute top-0 right-0 bg-green-600 text-white px-2 py-0.5 text-xs font-bold rounded-bl-md shadow">
          Counter No: {cashier.counterNum}
        </div>
      )}

      {/* Date and Time */}
      <div className="mb-2 text-left">
        <p className="text-sm font-medium text-gray-700">
          {formatDate(currentDateTime)} • {formatTime(currentDateTime)}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cashier ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Cashier ID
            </p>
            <p className="text-sm font-medium text-gray-800">{cashier.cashierId}</p>
          </div>

          <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Name
            </p>
            <p className="text-sm font-medium text-gray-800">{cashier.cashierName}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-900">No cashier data available</p>
          <p className="text-xs text-gray-500">Check your connection or system configuration</p>
        </div>
      )}
    </div>
  );
};

export default CashierDetails;
