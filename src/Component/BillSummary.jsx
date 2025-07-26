import React, { useEffect, useRef, useCallback } from 'react';

function BillSummary({
  products,
  customerOutstandingCredit = 0,
  currentBillTotal,
  grandTotal,
  transportCharge = 0,
  onProceedToPayment,
  onPrint,
  onTriggerPrint,
  onTriggerPayment
}) {
  const printButtonRef = useRef(null);
  const paymentButtonRef = useRef(null);

  const triggerPrint = useCallback(() => {
    printButtonRef.current?.click();
  }, []);

  const triggerPayment = useCallback(() => {
    paymentButtonRef.current?.click();
  }, []);

  useEffect(() => {
    if (onTriggerPrint) onTriggerPrint.current = triggerPrint;
    if (onTriggerPayment) onTriggerPayment.current = triggerPayment;
  }, [onTriggerPrint, onTriggerPayment, triggerPrint, triggerPayment]);

  const calculateSubtotal = () =>
    products.reduce((sum, item) => sum + (item.basicPrice * item.quantity), 0);

  const calculateGST = () =>
    products.reduce((sum, item) => sum + (item.gstAmount * item.quantity), 0);

  const calculateSGST = () =>
    products.reduce((sum, item) => sum + (item.sgstAmount * item.quantity), 0);

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm sticky">
      <h2 className="text-sm font-semibold mb-2">Bill Summary</h2>
      <div className="space-y-2">
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              ₹{products.length ? calculateSubtotal().toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">GST:</span>
            <span className="font-medium">
              ₹{products.length ? calculateGST().toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">SGST:</span>
            <span className="font-medium">
              ₹{products.length ? calculateSGST().toFixed(2) : '0.00'}
            </span>
          </div>
          
          {transportCharge > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Transport Charge:</span>
              <span className="font-medium">
                ₹{transportCharge.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm">
            <span className="font-semibold">Current Bill Total:</span>
            <span className="font-semibold text-base">
              ₹{currentBillTotal.toFixed(2)}
            </span>
          </div>

            {/* Previous Unpaid Amount - Always visible with conditional styling */}
            <div className={`flex justify-between text-sm mb-1 ${customerOutstandingCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span className="font-medium">Credit Due:</span>
              <span className="font-medium">
                ₹{customerOutstandingCredit.toFixed(2)}
              </span>
            </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm">
            <span className="font-semibold">Grand Total Payable:</span>
            <span className="font-semibold text-xl text-blue-700">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={onPrint}
                disabled={products.length === 0 && customerOutstandingCredit === 0}
                className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${
                  (products.length === 0 && customerOutstandingCredit === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                ref={printButtonRef}
              >
                Save & Print
              </button>
              <button
                onClick={onProceedToPayment}
                disabled={(products.length === 0 && customerOutstandingCredit === 0)}
                className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${
                  (products.length === 0 && customerOutstandingCredit === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                ref={paymentButtonRef}
              >
                Payment
              </button>
            </div>
          </div>
    </div>
  );
}

export default BillSummary;