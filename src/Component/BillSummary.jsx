import React, { useEffect, useRef, useCallback } from 'react';

function BillSummary({
  customer,
  products,
  onProceedToPayment,
  onPrint,
  isHeld, // indicates if the *current* bill (in workspace) is the held one
  onHoldToggle,
  heldBillExists, // NEW PROP: indicates if there's *any* bill currently held in state
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
      const base = item.mrp;
      const discount = base * (item.discount / 100);
      return sum + (base - discount);
    }, 0);

  const calculateGST = () =>
    products.reduce((sum, item) => {
      const base = item.mrp;
      const discount = base * (item.discount / 100);
      const discounted = base - discount;
      return sum + (discounted * item.gst) / 100;
    }, 0);

  const calculateTotal = () =>
    products.reduce((sum, item) => {
      const base =  item.mrp;
      const discount = base * (item.discount / 100);
      const discounted = base - discount;
      const gst = (discounted * item.gst) / 100;
      return sum + discounted + gst;
    }, 0);

  // Determine the button's text and whether it should be disabled
  let holdButtonText = 'Hold';
  let isHoldButtonDisabled = false;

  if (isHeld) {
    // If the current bill is the held bill (meaning it was just unheld or is being reviewed)
    // This state usually means you've just restored it, or it was the only bill.
    // The button should then act as "Hold" again for this current (restored) bill.
    holdButtonText = 'Hold';
    // You can't hold an empty bill
    isHoldButtonDisabled = products.length === 0;
  } else {
    // If the current bill is *not* the held bill (it's a new or active bill)
    if (products.length > 0) {
      // If there are products in the current bill, it means you can 'Hold' it.
      holdButtonText = 'Hold';
      isHoldButtonDisabled = false;
    } else if (heldBillExists) {
      // If no current products but a held bill exists, the button should be 'Unhold'
      holdButtonText = 'Unhold';
      isHoldButtonDisabled = false; // It should be clickable to unhold
    } else {
      // No current products, and no held bill exists - disable "Hold"
      holdButtonText = 'Hold';
      isHoldButtonDisabled = true;
    }
  }


  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm sticky top-4">
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
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-base">
              ₹{products.length ? calculateTotal().toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Button Row */}
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

        {/* Optional Back/Next Section (Keeping existing, though not directly used in problem) */}
        <div className="pt-2 space-y-2">
          {/* ... (onBack and onProceed buttons) ... */}
        </div>
      </div>
    </div>
  );
}

export default BillSummary;
