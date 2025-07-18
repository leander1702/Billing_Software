import React, { useEffect, useRef, useCallback } from 'react';

function BillSummary({
  customer,
  products,
  onProceedToPayment,
  onPrint,
  isHeld,
  onHoldToggle,
  heldBillExists,
  onTriggerHold,
  onTriggerPrint,
  onTriggerPayment
}) {
  const holdButtonRef = useRef(null);
  const printButtonRef = useRef(null);
  const paymentButtonRef = useRef(null);

  const triggerHold = useCallback(() => {
    holdButtonRef.current?.click();
  }, []);

  const triggerPrint = useCallback(() => {
    printButtonRef.current?.click();
  }, []);

  const triggerPayment = useCallback(() => {
    paymentButtonRef.current?.click();
  }, []);

  useEffect(() => {
    if (onTriggerHold) onTriggerHold.current = triggerHold;
    if (onTriggerPrint) onTriggerPrint.current = triggerPrint;
    if (onTriggerPayment) onTriggerPayment.current = triggerPayment;
  }, [onTriggerHold, onTriggerPrint, onTriggerPayment, triggerHold, triggerPrint, triggerPayment]);

  const calculateSubtotal = () =>
    products.reduce((sum, item) => {
      const baseAmount = (item.basicPrice * item.quantity);
      return sum + (baseAmount );
    }, 0);

  const calculateGST = () =>
    products.reduce((sum, item) => {
     const baseAmount =  (item.gstAmount * item.quantity);
      // const gstAmount = (baseAmount * (item.gst*item.quantity)) / 100;
       return sum + (baseAmount );
    }, 0);

     const calculateSGST = () =>
    products.reduce((sum, item) => {
     const baseAmount =(item.sgstAmount * item.quantity);
      // const gstAmount = (baseAmount * (item.gst*item.quantity)) / 100;
       return sum + (baseAmount );
    }, 0);

  const calculateTotal = () => calculateSubtotal() + (calculateGST() + calculateSGST());

  let holdButtonText = 'Hold';
  let isHoldButtonDisabled = false;

  if (isHeld) {
    holdButtonText = 'Hold';
    isHoldButtonDisabled = products.length === 0;
  } else {
    if (products.length > 0) {
      holdButtonText = 'Hold';
      isHoldButtonDisabled = false;
    } else if (heldBillExists) {
      holdButtonText = 'Unhold';
      isHoldButtonDisabled = false;
    } else {
      holdButtonText = 'Hold';
      isHoldButtonDisabled = true;
    }
  }

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm sticky ">
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
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-base">
              ₹{products.length ? calculateTotal().toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            onClick={onHoldToggle}
            disabled={isHoldButtonDisabled}
            className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${
              isHoldButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : (holdButtonText === 'Hold' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-500 text-white hover:bg-blue-600')
            }`}
            ref={holdButtonRef}
          >
            {holdButtonText}
          </button>

          <button
            onClick={onPrint}
            disabled={!products.length}
            className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${
              !products.length
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            ref={printButtonRef}
          >
            Print
          </button>
          <button
            onClick={onProceedToPayment}
            disabled={!products.length || !customer?.id}
            className={`flex-1 py-1 text-sm rounded-sm focus:outline-none ${
              !products.length || !customer?.id
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