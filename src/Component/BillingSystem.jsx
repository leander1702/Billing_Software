// Component/BillingSystem.jsx
import React, { useState, useEffect, useRef } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';
import CashierDetails from './CashierDetails';
import Api from '../services/api';

const BillingSystem = ({
  onFocusProductSearch,
  onFocusProductCode,
  onFocusQuantity,
  onTriggerAddProduct,
  onFocusCustomerName,
  onFocusPhoneNumber,
  onTriggerHold,
  onTriggerPrint,
  onTriggerPayment,
}) => {
  const [customer, setCustomer] = useState({
    id: '',
    name: '',
    contact: '',
  });
  const [products, setProducts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [heldBill, setHeldBill] = useState(null); // This holds the actual held bill data
  const [isHeld, setIsHeld] = useState(false); // This indicates if the *current* bill displayed is the held one

  const handleHoldToggle = () => {
    if (heldBill && products.length === 0) {
      // Scenario 1: There's a held bill, and the current workspace is empty.
      // This means the user wants to UNHOLD the previous bill.
      setCustomer(heldBill.customer);
      setProducts(heldBill.products);
      setHeldBill(null); // Clear the held bill after restoring
      setIsHeld(true); // Now the current bill *is* the held bill
      toast.info('Held bill restored!');
    } else if (products.length > 0) {
      // Scenario 2: There are products in the current workspace.
      // This means the user wants to HOLD the current bill.
      setHeldBill({ customer, products }); // Save the current bill
      setCustomer({ id: '', name: '', contact: '' }); // Clear current workspace
      setProducts([]); // Clear current workspace
      setIsHeld(false); // The workspace is no longer showing the held bill (it's empty)
      toast.info('Bill held successfully! Starting a new bill.');
    } else {
      // Scenario 3: No products in current workspace, and no held bill to unhold.
      toast.warn('Nothing to hold or unhold.');
    }
  };


  const handlePrint = () => {
    if (products.length === 0) {
      toast.error('No products to print in the bill.');
      return;
    }
    const billData = {
      customer,
      products,
      subtotal: products.reduce((sum, item) => {
        const base = item.totalPrice * item.quantity;
        const discount = base * (item.discount / 100);
        return sum + (base - discount);
      }, 0),
      gst: products.reduce((sum, item) => {
        const base = item.totalPrice * item.quantity;
        const discount = base * (item.discount / 100);
        const discounted = base - discount;
        return sum + (discounted * item.gst) / 100;
      }, 0),
      total: products.reduce((sum, item) => {
        const base = item.totalPrice * item.quantity;
        const discount = base * (item.discount / 100);
        const discounted = base - discount;
        const gst = (discounted * item.gst) / 100;
        return sum + discounted + gst;
      }, 0),
    };

    console.log("Printing bill", billData);
    toast.success('Print command sent (check console for bill data)!');
  };


 const handleCustomerSubmit = async (customerData) => {
  try {
    setIsCheckingCustomer(true);
    const response = await Api.get('/bills');
    const bills = response.data;

    const existing = bills.find(
      (bill) => bill.customer.contact === customerData.contact
    );

    if (existing) {
      toast.info('Existing customer detected. Auto-filling details.');
      setCustomer({
        id: existing.customer.id,
        name: existing.customer.name,
        contact: existing.customer.contact,
      });
    } else {
      const allCustomerIds = bills
        .map((bill) => parseInt(bill.customer.id))
        .filter(id => !isNaN(id));
      const maxId = allCustomerIds.length > 0 ? Math.max(...allCustomerIds) : 1000;
      const newId = maxId + 1;

      setCustomer({
        ...customerData,
        id: newId.toString(),
      });
      toast.success(`New customer ID assigned: ${newId}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status (4xx/5xx)
        console.error('Server Error:', error.response.status, error.response.data);
        toast.error('Server error while checking customer');
      } else if (error.request) {
        // No response received
        console.error('Network Error:', error.message);
        toast.error('Network error. Please check your connection');
      }
    } else {
      // Non-Axios error
      console.error('Error:', error.message);
      toast.error('Error checking customer. Please try again.');
    }
  } finally {
    setIsCheckingCustomer(false);
  }
};

  const handleEditCustomer = () => {
    console.log('Edit customer initiated');
    toast.info('Customer editing feature coming soon!');
  };

  const handleAddProduct = (product) => {
    setProducts([...products, product]);
    setIsHeld(false); // Any new product means it's not the held bill anymore
  };

  const handleEditProduct = (index, updatedProduct) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
    setIsHeld(false); // Editing means it's no longer the pristine held bill
  };

  const handleRemoveProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
    setIsHeld(false); // Removing means it's no longer the pristine held bill
  };

  const calculateSubtotal = () =>
    products.reduce((total, product) => total + product.totalPrice, 0);

  const calculateGst = () =>
    products.reduce(
      (total, product) => total + (product.totalPrice * (product.gst || 0)) / 100,
      0
    );

  const calculateTotal = () => calculateSubtotal();

  const handleNewCustomer = () => {
    setCustomer({
      id: '',
      name: '',
      contact: '',
    });
    setProducts([]);
    setCurrentBill(null);
    setIsHeld(false); // Starting a new bill, so the current workspace is not 'held'
    // Do NOT clear heldBill here. It remains so you can Unhold it later.
    toast.info('New bill started!');
  };


  const handleProceedToPayment = () => {
    if (!customer.id || !customer.name || !customer.contact) {
      toast.error('Please enter customer details before proceeding to payment.');
      return;
    }
    if (products.length === 0) {
      toast.error('Please add products to the bill before proceeding to payment.');
      return;
    }

    const subtotal = calculateSubtotal();
    const gst = calculateGst();
    const total = calculateTotal();

    setCurrentBill({
      customer,
      products,
      subtotal,
      gst,
      total,
      date: new Date().toISOString(),
      billNumber: `BILL-${customer.id || 'N/A'}-${Date.now()}`,
    });
    setShowPaymentModal(true);
  };

const handlePaymentComplete = async (paymentDetails) => {
  if (!currentBill) {
    toast.error('No bill data available for payment. Please try again.');
    return;
  }

  const completeBill = {
    customer: currentBill.customer,
    products: currentBill.products,
    subtotal: currentBill.subtotal,
    gst: currentBill.gst,
    total: currentBill.total,
    payment: {
      method: paymentDetails.method,
      amountPaid: paymentDetails.amountPaid,
      transactionId: paymentDetails.transactionId || '',
    },
    billNumber: currentBill.billNumber,
    date: currentBill.date,
  };

  console.log("✅ Sending completeBill to backend:", completeBill);

  try {
    setIsSaving(true);

    const response = await Api.post('/bills', completeBill, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Bill saved successfully:', response.data);
    toast.success('Payment successful and bill saved!');
    handleFinalClose(); // Call handleFinalClose after successful payment
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status (4xx/5xx)
        console.error('❌ Backend error:', error.response.status, error.response.data);
        const errorMessage = error.response.data?.message || 'Failed to save bill';
        toast.error(`Failed to save bill: ${errorMessage}`);
      } else if (error.request) {
        // No response received
        console.error('❌ Network error:', error.message);
        toast.error('Network error. Please check your connection');
      }
    } else {
      // Non-Axios error
      console.error('❌ Unexpected error:', error.message);
      toast.error(`Failed to save bill: ${error.message}`);
    }
  } finally {
    setIsSaving(false);
  }
};

  const handleFinalClose = () => {
    setShowPaymentModal(false);
    setCustomer({ id: '', name: '', contact: '' });
    setProducts([]);
    setCurrentBill(null);
    setIsHeld(false); // The current workspace is now empty, it's not a held bill.
    // IMPORTANT: heldBill is *NOT* cleared here. It persists,
    // allowing the "Unhold" button to appear when the workspace is empty.
    toast.info('Ready for a new bill!');
  };

  const nextCustomerIdDisplay = customer.id || 'New Customer';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 font-inter max-h-screen">
      <div className="mx-auto p-2 max-w-full">
        <div className="flex flex-col lg:flex-row gap-1">
          <div className="lg:w-3/4">
            <ProductList
              products={products}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onRemove={handleRemoveProduct}
              onFocusProductSearch={onFocusProductSearch}
              onFocusProductCode={onFocusProductCode}
              onFocusQuantity={onFocusQuantity}
              onTriggerAddProduct={onTriggerAddProduct}
            />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-1">
            {/* <CashierDetails /> */}
            <CustomerDetails
              customer={customer}
              onSubmit={handleCustomerSubmit}
              onEdit={handleEditCustomer}
              nextCustomerId={nextCustomerIdDisplay}
              isCheckingCustomer={isCheckingCustomer}
              onFocusCustomerName={onFocusCustomerName}
              onFocusPhoneNumber={onFocusPhoneNumber}
            />
            <BillSummary
              customer={customer}
              products={products}
              onProceedToPayment={handleProceedToPayment}
              onPrint={handlePrint}
              isHeld={isHeld}
              onHoldToggle={handleHoldToggle}
              heldBillExists={!!heldBill}
              onTriggerHold={onTriggerHold}
              onTriggerPrint={onTriggerPrint}
              onTriggerPayment={onTriggerPayment}
            />
          </div>
        </div>
      </div>

      {showPaymentModal && currentBill && (
        <PaymentModal
          total={currentBill.total}
          onClose={handleFinalClose}
          onComplete={handlePaymentComplete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default BillingSystem;