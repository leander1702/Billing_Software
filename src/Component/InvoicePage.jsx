import React, { useRef, useCallback, useState } from 'react';
import ProductList from './ProductList'; // Make sure this path is correct

// Use forwardRef to allow a parent component (App.js) to pass a ref to InvoicePage.
// This ref will be used by App.js to call the focus/trigger methods defined in useImperativeHandle.
const InvoicePage = React.forwardRef(
  ({ products, onAdd, onEdit, onRemove, onBillComplete }, ref) => {
    // State for customer details (manage these here in InvoicePage)
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Ref for the ProductList component itself
    // This ref will allow InvoicePage to call methods exposed by ProductList (via useImperativeHandle)
    const productListRef = useRef(null);

    // Refs for elements directly within InvoicePage (Customer details and action buttons)
    const customerNameInputRef = useRef(null);
    const phoneNumberInputRef = useRef(null);
    const holdButtonRef = useRef(null);
    const printButtonRef = useRef(null);
    const paymentButtonRef = useRef(null);

    // useImperativeHandle allows the parent component (App.js) to access
    // these specific functions on this InvoicePage instance via the ref it passes.
    React.useImperativeHandle(ref, () => ({
      // Methods to focus inputs in ProductList (delegated calls)
      focusProductSearch: () => productListRef.current?.focusSearchProductInput(),
      focusProductCode: () => productListRef.current?.focusProductCodeInput(),
      focusQuantity: () => productListRef.current?.focusQuantityInput(),
      triggerAddProduct: () => productListRef.current?.triggerAddProductClick(),

      // Methods to focus inputs/trigger actions directly in InvoicePage
      focusCustomerName: () => customerNameInputRef.current?.focus(),
      focusPhoneNumber: () => phoneNumberInputRef.current?.focus(),
      triggerHold: () => holdButtonRef.current?.click(),
      triggerPrint: () => printButtonRef.current?.click(),
      triggerPayment: () => paymentButtonRef.current?.click(),
    }));

    // Handler for customer name input changes
    const handleCustomerNameChange = useCallback((e) => {
      setCustomerName(e.target.value);
    }, []);

    // Handler for phone number input changes
    const handlePhoneNumberChange = useCallback((e) => {
      setPhoneNumber(e.target.value);
    }, []);

    // Placeholder functions for the button actions.
    // In a real application, these would contain your business logic.
    const handleHoldClick = useCallback(() => {
      console.log("InvoicePage: Hold transaction logic triggered!");
      // Implement your logic to hold the current bill (e.g., save to a 'held bills' list)
      // You might pass the 'products' and customer details to a global state/context or API.
    }, []);

    const handlePrintClick = useCallback(() => {
      console.log("InvoicePage: Print bill logic triggered!");
      // Implement your printing logic here (e.g., generate PDF, send to printer)
    }, []);

    const handlePaymentClick = useCallback(() => {
      console.log("InvoicePage: Process payment logic triggered!");
      // Implement your payment processing logic here
      // This might involve showing a payment modal, validating payment, and then calling onBillComplete.
      onBillComplete(); // Call the prop function to finalize the bill and clear the cart in App.js
    }, [onBillComplete]);


    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>

 
        <div className="bg-white p-3 mb-4 border border-gray-200 shadow-sm rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name (F5)</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={customerName}
                onChange={handleCustomerNameChange}
                ref={customerNameInputRef} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number (F6)</label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                ref={phoneNumberInputRef} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        {/* ProductList Component */}
        <ProductList
          ref={productListRef}
          products={products}
          onAdd={onAdd}
          onEdit={onEdit}
          onRemove={onRemove}
          onBillComplete={onBillComplete} 
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-4 bg-white p-3 border border-gray-200 shadow-sm rounded-lg">
          <button
            type="button" 
            ref={holdButtonRef}
            onClick={handleHoldClick}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Hold (F7)
          </button>
          <button
            type="button"
            ref={printButtonRef} 
            onClick={handlePrintClick}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Print (F8)
          </button>
          <button
            type="button"
            ref={paymentButtonRef} 
            onClick={handlePaymentClick}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Payment (F9)
          </button>
        </div>
      </div>
    );
  }
);

export default InvoicePage;