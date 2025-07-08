import { useState } from 'react';

function PaymentModal({ total, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showScannerMessage, setShowScannerMessage] = useState(false); // New state for scanner message

  // Calculate change dynamically for cash payments
  const changeAmount = cashReceived && parseFloat(cashReceived) >= total
    ? (parseFloat(cashReceived) - total).toFixed(2)
    : '0.00';

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    let details;
    switch (paymentMethod) {
      case 'cash':
        // Validate cash received amount
        if (parseFloat(cashReceived) < total) {
          // Using a custom message box instead of alert()
          alert('Amount received is less than total amount.'); // Placeholder for custom modal
          return;
        }
        details = {
          method: 'cash',
          amountReceived: parseFloat(cashReceived),
          change: parseFloat(cashReceived) - total,
          amount: total // Include total amount for consistency
        };
        break;
      case 'credit_card':
        details = {
          method: 'credit_card',
          amount: total,
          // In a real app, this would involve a secure payment gateway integration
          // For simulation, we just mark it as successful
        };
        break;
      case 'qr_scan':
        details = {
          method: 'qr_scan',
          amount: total,
          // Similar to card, this simulates a QR payment completion
        };
        break;
      default:
        return;
    }

    setPaymentDetails(details);
    setPaymentSuccess(true);
    onComplete(details); // Notify parent component of completion
  };

  const handleSaveAndPrint = async () => {
    setIsSaving(true);
    try {
      // Print the bill first
      printBill();

      // Close the modal after printing
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      // Using a custom message box instead of alert()
      alert('Failed to save data. Please try again.'); // Placeholder for custom modal
    } finally {
      setIsSaving(false);
    }
  };

  const printBill = () => {
    const now = new Date();
    const printContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; margin-bottom: 20px; color: #333; font-size: 24px;">Invoice</h2>
        <div style="margin-bottom: 15px; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
          <p style="margin-bottom: 5px; font-size: 14px;"><strong>Date:</strong> ${now.toLocaleString()}</p>
          <p style="margin-bottom: 5px; font-size: 14px;"><strong>Payment Method:</strong> ${paymentDetails.method === 'cash' ? 'Cash' : paymentDetails.method === 'credit_card' ? 'Credit Card' : 'QR Scan'}</p>
          ${paymentDetails.method === 'cash' ? `
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Amount Received:</strong> ₹${paymentDetails.amountReceived.toFixed(2)}</p>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Change:</strong> ₹${paymentDetails.change.toFixed(2)}</p>
          ` : ''}
          ${paymentDetails.method === 'credit_card' ? `
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Card Payment:</strong> Successful</p>
          ` : ''}
          ${paymentDetails.method === 'qr_scan' ? `
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>QR Scan Payment:</strong> Successful</p>
          ` : ''}
        </div>
        <div style="border-top: 1px dashed #ddd; padding-top: 10px; margin-top: 10px;">
          <p style="text-align: right; font-size: 22px; font-weight: bold; color: #333;">
            Total: ₹${total.toFixed(2)}
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-style: italic; color: #666; font-size: 14px;">
          Thank you for your purchase!
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            @media print {
              body { visibility: hidden; }
              .print-content { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
            }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <div class="print-content">${printContent}</div>
          <script>
            // Use a slight delay to ensure content is rendered before printing
            setTimeout(() => {
              window.print();
              window.close();
            }, 200);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle payment method change to show/hide scanner message
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'credit_card' || method === 'qr_scan') {
      setShowScannerMessage(true);
    } else {
      setShowScannerMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Complete Payment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              &times; {/* Times symbol for close */}
            </button>
          </div>

          {!paymentSuccess ? (
            <>
              {/* Total Amount Display */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-800">Total Amount:</span>
                <span className="text-2xl font-extrabold text-blue-900">₹{total.toFixed(2)}</span>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('cash')}
                      className={`py-3 rounded-lg border-2 transition-all duration-200 ease-in-out
                        ${paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('credit_card')}
                      className={`py-3 rounded-lg border-2 transition-all duration-200 ease-in-out
                        ${paymentMethod === 'credit_card' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('qr_scan')}
                      className={`py-3 rounded-lg border-2 transition-all duration-200 ease-in-out
                        ${paymentMethod === 'qr_scan' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      QR Scan
                    </button>
                  </div>
                </div>

                {/* Cash Payment Fields */}
                {paymentMethod === 'cash' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label htmlFor="cashReceived" className="block text-sm font-medium text-gray-700 mb-2">Amount Received (₹)</label>
                    <input
                      id="cashReceived"
                      type="number"
                      min={total} // Suggest minimum based on total
                      step="0.01"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder={`Enter amount (min ₹${total.toFixed(2)})`}
                      required
                    />
                    {cashReceived && parseFloat(cashReceived) >= total && (
                      <div className="mt-3 text-right">
                        <span className="text-md font-medium text-gray-600">Change Due: </span>
                        <span className="text-xl font-bold text-green-700">
                          ₹{changeAmount}
                        </span>
                      </div>
                    )}
                    {cashReceived && parseFloat(cashReceived) < total && (
                       <div className="mt-3 text-right">
                        <span className="text-md font-medium text-gray-600">Remaining: </span>
                        <span className="text-xl font-bold text-red-600">
                          ₹{(total - parseFloat(cashReceived)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Credit Card / QR Scan Message */}
                {(paymentMethod === 'credit_card' || paymentMethod === 'qr_scan') && showScannerMessage && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center text-yellow-800">
                    <p className="font-medium">Please use the {paymentMethod === 'credit_card' ? 'card scanner machine' : 'QR scanner machine'} to complete the payment.</p>
                    <p className="text-sm mt-1">Click "Complete Payment" once the transaction is processed externally.</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-in-out"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
                    // Disable if cash is selected but amount received is insufficient
                    disabled={paymentMethod === 'cash' && parseFloat(cashReceived) < total}
                  >
                    Complete Payment
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Payment Success State */
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Successful!</h3>
              <p className="text-md text-gray-600 mb-8">
                Total amount <span className="font-bold">₹{total.toFixed(2)}</span> has been received via <span className="font-bold">{paymentDetails?.method === 'cash' ? 'Cash' : paymentDetails?.method === 'credit_card' ? 'Credit Card' : 'QR Scan'}</span>.
              </p>
              {paymentDetails?.method === 'cash' && (
                <p className="text-sm text-gray-500 mb-4">Change due: <span className="font-bold text-green-700">₹{paymentDetails.change.toFixed(2)}</span></p>
              )}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleSaveAndPrint}
                  disabled={isSaving}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out ${
                    isSaving ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Printing...' : 'Save & Print Bill'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-in-out"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
