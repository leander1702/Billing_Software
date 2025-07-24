import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Api from '../services/api';

const PaymentModal = ({ currentBillData, onClose, onComplete, isSaving }) => {
  const {
    customer = {},
    currentBillTotal = 0, // Amount of the *new* bill being generated (can be 0 if no new bill)
    // previousOutstandingCredit is now primarily for display/information, not calculation of grandTotal
    billNumber: newBillNumber = '' // The bill number for the *new* bill
  } = currentBillData || {};

  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [change, setChange] = useState(0);
  const [remainingUnpaid, setRemainingUnpaid] = useState(0);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]); // Stores _id of selected unpaid bills

  // State for the user-entered amount for outstanding bills
  // This defaults to the sum of selected bills' unpaid amounts, but can be manually reduced.
  const [userEnteredOutstandingPayment, setUserEnteredOutstandingPayment] = useState(0);

  // Calculate the total actual outstanding amount for all selected bills (read-only, max limit)
  const actualSelectedOutstandingTotal = useMemo(() => {
    return unpaidBills.reduce((sum, bill) => {
      if (selectedBills.includes(bill._id)) {
        return sum + (bill.unpaidAmountForThisBill || 0);
      }
      return sum;
    }, 0);
  }, [unpaidBills, selectedBills]);

  // Effect to update userEnteredOutstandingPayment when selected bills change
  useEffect(() => {
    // When selected bills change, default the user-entered amount to the full selected outstanding total.
    // The user can then reduce this amount if they only want to partially pay the selected outstanding.
    setUserEnteredOutstandingPayment(actualSelectedOutstandingTotal);
  }, [actualSelectedOutstandingTotal]); // Depend on the calculated total of selected outstanding bills

  // Calculate the grand total based on current bill + user-entered amount for outstanding
  const calculatedGrandTotal = useMemo(() => {
    const totalCurrentBill = currentBillTotal || 0;
    const totalSelectedOutstanding = parseInt(userEnteredOutstandingPayment) || 0; // Use parseInt for integer
    return totalCurrentBill + totalSelectedOutstanding;
  }, [currentBillTotal, userEnteredOutstandingPayment]); // Depends on userEnteredOutstandingPayment

  // Effect to initialize amountPaid to calculatedGrandTotal
  useEffect(() => {
    setAmountPaid(calculatedGrandTotal);
  }, [calculatedGrandTotal]);

  // Effect to recalculate change and remaining unpaid whenever amountPaid or calculatedGrandTotal changes
  useEffect(() => {
    const calculatedChange = amountPaid - calculatedGrandTotal;
    setChange(Math.max(0, calculatedChange));
    setRemainingUnpaid(Math.max(0, -calculatedChange));
  }, [amountPaid, calculatedGrandTotal]);

  // Effect to fetch unpaid bills when customer ID is available
  useEffect(() => {
    if (customer?.id) {
      fetchUnpaidBills();
    }
  }, [customer?.id]);

  const fetchUnpaidBills = async () => {
    setIsLoading(true);
    try {
      const response = await Api.get(`/bills/unpaid`, {
        params: { customerId: customer.id }
      });
      // Filter to ensure only bills with actual unpaid amounts are shown
      setUnpaidBills(Array.isArray(response.data) ? 
        response.data.filter(bill => (bill.unpaidAmountForThisBill || 0) > 0) : []);
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
      toast.error('Failed to load unpaid bills');
      setUnpaidBills([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleBillSelection = (billId) => {
    setSelectedBills((prevSelected) => {
      const newSelected = prevSelected.includes(billId)
        ? prevSelected.filter((id) => id !== billId)
        : [...prevSelected, billId];
      return newSelected;
    });
  };

  const handleSelectAllBills = () => {
    if (selectedBills.length === unpaidBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(unpaidBills.map((bill) => bill._id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return; // Prevent multiple submissions

    // Basic validations
    if (amountPaid < 0) {
      toast.error('Payment amount cannot be negative');
      return;
    }
    if (userEnteredOutstandingPayment > actualSelectedOutstandingTotal) {
      toast.error(`Amount for outstanding bills cannot exceed ${formatCurrency(actualSelectedOutstandingTotal)}`);
      return;
    }
    if (userEnteredOutstandingPayment < 0) {
      toast.error('Outstanding payment cannot be negative');
      return;
    }

    let paymentForCurrentBill = 0;
    let paymentForOutstandingBills = 0;
    let remainingPayment = amountPaid; // Total amount customer is paying

    // Determine if there's a new bill being paid for
    const isNewBillPresent = (currentBillTotal || 0) > 0;

    if (isNewBillPresent) {
      // Scenario 1: New Bill Payment + Optional Outstanding Payments
      // 1. Prioritize payment for the current bill
      if (remainingPayment >= currentBillTotal) {
        paymentForCurrentBill = currentBillTotal;
        remainingPayment -= currentBillTotal;
      } else {
        paymentForCurrentBill = remainingPayment;
        remainingPayment = 0;
      }

      // 2. Then, allocate remaining payment to selected outstanding bills, up to userEnteredOutstandingPayment
      paymentForOutstandingBills = Math.min(remainingPayment, parseInt(userEnteredOutstandingPayment) || 0); // Use parseInt
      remainingPayment -= paymentForOutstandingBills; // Update remaining payment after allocating to outstanding
    } else {
      // Scenario 2: Outstanding Bill Payment ONLY (no new bill)
      // All payment goes towards selected outstanding bills, up to userEnteredOutstandingPayment
      paymentForCurrentBill = 0; // No new bill to pay for
      paymentForOutstandingBills = Math.min(remainingPayment, parseInt(userEnteredOutstandingPayment) || 0); // Use parseInt
      remainingPayment -= paymentForOutstandingBills; // Update remaining payment
    }

    // Call the onComplete callback with all necessary payment details
    onComplete({
      method: paymentMethod,
      amountPaid: parseInt(amountPaid), // Use parseInt for integer
      transactionId: transactionId.trim() || undefined,
      isNewBillPayment: isNewBillPresent, // Indicate if a new bill is part of this transaction
      currentBillPayment: paymentForCurrentBill, // Amount applied to the current (new) bill
      selectedOutstandingPayment: paymentForOutstandingBills, // Amount applied to selected outstanding bills
      selectedUnpaidBillIds: selectedBills, // IDs of bills the user selected for payment
      totalAmountDueForSelected: calculatedGrandTotal, // The total amount that the user is attempting to cover
      newBillNumber: isNewBillPresent ? newBillNumber : undefined, // Pass new bill number only if present
      customer: customer, // Pass customer details back to parent for easier API calls
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      // Removed minimumFractionDigits: 2 to display as integer
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // For AM/PM format
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Determine the display bill number based on whether it's a new bill or just outstanding payment
  const displayBillNumber = (currentBillTotal || 0) > 0 ? newBillNumber : 'N/A (Outstanding Settlement)';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Payment Settlement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSaving}>
            ✕
          </button>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name:</p>
              <p className="font-medium">{customer.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact:</p>
              <p className="font-medium">{customer.contact || 'N/A'}</p>
            </div>
            {customer.aadhaar && (
              <div>
                <p className="text-sm text-gray-600">Aadhaar:</p>
                <p className="font-medium">{customer.aadhaar}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">{ (currentBillTotal || 0) > 0 ? 'Current Bill #' : 'Settling For:'}</p>
              <p className="font-medium">{displayBillNumber}</p>
            </div>
          </div>
        </div>

        {/* Outstanding Bills Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">
              Outstanding Bills
              {isLoading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
            </h3>
            {unpaidBills.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllBills}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                {selectedBills.length === unpaidBills.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {unpaidBills.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              No outstanding bills found
            </div>
          ) : (
            <div className="space-y-4">
              {unpaidBills.map((bill) => (
                <div
                  key={bill._id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    selectedBills.includes(bill._id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600 rounded mr-3"
                        checked={selectedBills.includes(bill._id)}
                        onChange={() => handleBillSelection(bill._id)}
                      />
                      <div>
                        <h4 className="font-medium">Bill #: {bill.billNumber}</h4>
                        <p className="text-sm text-gray-500">{formatDateTime(bill.date)}</p>
                      </div>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-gray-600">Bill Total:</p>
                      <p className="font-medium">{formatCurrency(bill.currentBillTotal)}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-gray-600">Paid Amount:</p>
                      <p className="font-medium text-green-600">{formatCurrency(bill.paidAmount || 0)}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg">
                      <p className="text-gray-600">Unpaid Amount:</p>
                      <p className="font-medium text-red-600">{formatCurrency(bill.unpaidAmountForThisBill || 0)}</p>
                    </div>
                  </div>

                  {/* Product Details for Outstanding Bills - Only show if selected */}
                  {selectedBills.includes(bill._id) && bill.products && bill.products.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <h5 className="font-semibold text-gray-700 mb-2">Products in this Bill:</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qty & Unit
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                MRP
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bill.products.map((product, pIndex) => (
                              <tr key={pIndex}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{product.quantity} {product.unit}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.mrpPrice || product.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-blue-50 p-4  mb-6 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Payment Summary</h3>
          <div className="space-y-2">
            {/* Show Current Purchase Bill Total only if a new bill is present */}
            {(currentBillTotal || 0) > 0 && (
              <div className="flex justify-between">
                <span>Current Purchase Bill Total:</span>
                <span className="font-medium">{formatCurrency(currentBillTotal)}</span>
              </div>
            )}
            {selectedBills.length > 0 && (
              <div className="flex justify-between items-center">
                <label htmlFor="userEnteredOutstandingPaymentInput" className="text-sm font-medium text-gray-700">
                  Amount for Selected Outstanding Bills:
                </label>
                <input
                  id="userEnteredOutstandingPaymentInput"
                  type="number"
                  value={userEnteredOutstandingPayment}
                  onChange={(e) => setUserEnteredOutstandingPayment(Math.max(0, parseInt(e.target.value) || 0))} // Use parseInt
                  className="w-40 border no-arrows border-gray-300 rounded-md shadow-sm py-1 px-2 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="1" // Changed to step="1"
                  min="0"
                  max={actualSelectedOutstandingTotal} // Max value is the actual total of selected outstanding bills
                />
              </div>
            )}

            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="font-bold">Total Amount Due:</span>
              <span className="font-bold text-blue-700">{formatCurrency(calculatedGrandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 "
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block  text-sm font-medium text-gray-700 mb-1">
                Amount Paid *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))} // Use parseInt
                className="w-full border no-arrows border-gray-300 rounded-md shadow-sm 
                py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 "
                step="1" // Changed to step="1"
                min="0"
                required
              />
            </div>
          </div>

          {paymentMethod !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                focus:outline-none focus:ring-blue-500 focus:border-blue-500 "
                placeholder="Enter reference number"
              />
            </div>
          )}

          {/* Payment Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Amount Paid:</span>
              <span className="font-semibold">{formatCurrency(amountPaid)}</span>
            </div>
            {remainingUnpaid > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="font-medium">Remaining Due:</span>
                <span className="font-semibold">{formatCurrency(remainingUnpaid)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="font-medium">Change Due:</span>
                <span className="font-semibold">{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md
               hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg`}
              disabled={isSaving}
            >
              {isSaving ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
