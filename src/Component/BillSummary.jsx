import React, { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import Api from '../services/api';

function BillSummary({
  products,
  customerOutstandingCredit = 0,
  currentBillTotal,
  grandTotal,
  transportCharge = 0,
  onProceedToPayment,
  onPrint,
  onTriggerPrint,
  onTriggerPayment,
  customer,
  transportCharge: transportChargeValue
}) {
  const printButtonRef = useRef(null);
  const paymentButtonRef = useRef(null);

  const triggerPrint = useCallback(async () => {
    try {
      const billData = {
        customer,
        products,
        transportCharge: transportChargeValue,
        productSubtotal: calculateProductsSubtotal(),
        currentBillTotal: calculateCurrentBillTotal(),
        previousOutstandingCredit: customerOutstandingCredit,
        grandTotal: calculateGrandTotal(),
        date: new Date().toISOString(),
        billNumber: products.length > 0 ? `BILL-${customer.id || 'NEW'}-${Date.now()}` : 'OUTSTANDING-' + Date.now(),
        payment: {
          method: 'cash',
          currentBillPayment: calculateCurrentBillTotal(),
          selectedOutstandingPayment: 0
        }
      };

      const response = await Api.post('/bills', billData);
      const savedBill = response.data.bill;
      printButtonRef.current?.click();
      toast.success('Bill saved and printed successfully!');
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill: ' + (error.response?.data?.message || error.message));
    }
  }, [customer, products, transportChargeValue, customerOutstandingCredit]);

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
  const calculateProductsSubtotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    const sgst = calculateSGST();
    return subtotal + gst + sgst;
  };
  const calculateCurrentBillTotal = () => {
    const subtotal = calculateProductsSubtotal();
    return subtotal + (transportCharge || 0);
  };

  const calculateGrandTotal = () => {
    return calculateCurrentBillTotal() + (customerOutstandingCredit || 0);
  };

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm shadow-sm flex flex-col h-full">
      {/* <h2 className="text-lg font-semibold mb-1 text-gray-800">Bill Summary</h2> */}
      <h2 className="text-base font-semibold text-gray-800">Bill Summary</h2>
      <div className="border-t border-gray-200 mt-1"></div>
      <div className="flex-1 space-y-2 overflow-y-auto ">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              ₹{products.length ? calculateSubtotal().toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CGST:</span>
            <span className="font-medium">
              ₹{products.length ? calculateGST().toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SGST:</span>
            <span className="font-medium">
              ₹{products.length ? calculateSGST().toFixed(2) : '0.00'}
            </span>
          </div>


          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Transport Charge:</span>
            <span className="font-medium">
              ₹{transportCharge.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm font-semibold">
            <span>Current Bill Total:</span>
            <span>₹{currentBillTotal.toFixed(2)}</span>
          </div>

          <div className={`flex justify-between text-sm ${customerOutstandingCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span className="font-medium">Credit Due:</span>
            <span className="font-medium">
              ₹{customerOutstandingCredit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 mt-auto">
        <div className="flex justify-between text-lg font-bold">
          <span>Grand Total:</span>
          <span className="text-blue-700">₹{grandTotal.toFixed(2)}</span>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            onClick={onPrint}
            disabled={products.length >= 0 && customerOutstandingCredit > 0}
            className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${(products.length >= 0 && customerOutstandingCredit > 0)
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            ref={printButtonRef}
          >
            Save & Print
          </button>
          <button
            onClick={onProceedToPayment}
            disabled={(products.length === 0 && customerOutstandingCredit === 0)}
            className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${(products.length === 0 && customerOutstandingCredit === 0)
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            ref={paymentButtonRef}
          >
            Credits
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillSummary;