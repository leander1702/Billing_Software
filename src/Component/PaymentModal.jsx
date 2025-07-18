import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const PaymentModal = ({ currentBillData, onClose, onComplete, isSaving }) => {
  const { 
    customer = {},
    grandTotal = 0, 
    currentBillTotal = 0, 
    previousOutstandingCredit = 0,
    billNumber = ''
  } = currentBillData || {};
  
  const [amountPaid, setAmountPaid] = useState(grandTotal);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [change, setChange] = useState(0);
  const [remainingUnpaid, setRemainingUnpaid] = useState(0);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculatedChange = amountPaid - grandTotal;
    setChange(Math.max(0, calculatedChange));
    setRemainingUnpaid(Math.max(0, -calculatedChange));
  }, [amountPaid, grandTotal]);

  useEffect(() => {
    if (customer?.id) {
      fetchUnpaidBills();
    }
  }, [customer?.id]);

  const fetchUnpaidBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/bills/unpaid?customerId=${customer.id}`);
      if (!response.ok) throw new Error('Failed to fetch unpaid bills');
      const data = await response.json();
      setUnpaidBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
      toast.error('Failed to load unpaid bills');
      setUnpaidBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (amountPaid < 0) {
      toast.error('Payment amount cannot be negative');
      return;
    }
    onComplete({
      method: paymentMethod,
      amountPaid: parseFloat(amountPaid),
      transactionId: transactionId.trim() || undefined,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
              <p className="text-sm text-gray-600">Current Bill #:</p>
              <p className="font-medium">{billNumber}</p>
            </div>
          </div>
        </div>

        {/* Unpaid Bills Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Outstanding Bills
            {isLoading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
          </h3>
          
          {unpaidBills.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              No outstanding bills found
            </div>
          ) : (
            <div className="space-y-4">
              {unpaidBills.map((bill) => (
                <div key={bill._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{bill.billNumber}</h4>
                      <p className="text-sm text-gray-500">{formatDate(bill.date)}</p>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {bill.products.map((product, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-gray-600">Product:</p>
                            <p className="font-medium">{product.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Price:</p>
                            <p className="font-medium">{formatCurrency(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity:</p>
                            <p>{product.quantity} {product.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">MRP:</p>
                            <p>{formatCurrency(product.mrpPrice)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">GST:</p>
                            <p>{product.gst}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal:</p>
                            <p>{formatCurrency(product.price * product.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Bill Subtotal:</p>
                      <p className="font-medium">{formatCurrency(bill.productSubtotal)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">GST Amount:</p>
                      <p className="font-medium">{formatCurrency(bill.productGst)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Bill Total:</p>
                      <p className="font-medium">{formatCurrency(bill.currentBillTotal)}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-gray-600">Paid Amount:</p>
                      <p className="font-medium text-green-600">{formatCurrency(bill.paidAmount || 0)}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <p className="text-gray-600">Unpaid Amount:</p>
                      <p className="font-medium text-red-600">{formatCurrency(bill.unpaidAmountForThisBill || 0)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Payment Method:</p>
                      <p className="font-medium capitalize">{bill.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Previous Outstanding:</span>
              <span className="text-red-600">{formatCurrency(previousOutstandingCredit)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="font-bold">Total Amount Due:</span>
              <span className="font-bold text-blue-700">{formatCurrency(grandTotal)}</span>
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
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Paid *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
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
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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



