// Component/BillingSystem.jsx
import React, { useState, useRef } from 'react';
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
}) => {
  const [customer, setCustomer] = useState({
    id: '',
    name: '',
    contact: '',
    aadhaar: '',
    location: '',
  });
  const [products, setProducts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null); // This holds the 'new bill' data if any
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [customerOutstandingCredit, setCustomerOutstandingCredit] = useState(0);

  const printRef = useRef(null);
  const paymentRef = useRef(null);
  const customerNameFocusRef = useRef(null);
  const phoneNumberFocusRef = useRef(null);

  const handlePrint = () => {
    if (products.length === 0 && customerOutstandingCredit === 0) {
      toast.error('No products or outstanding credit to print in the bill.');
      return;
    }

    const billData = {
      customer,
      products,
      productSubtotal: calculateProductsSubtotal(),
      currentBillTotal: calculateCurrentBillTotal(),
      previousOutstandingCredit: customerOutstandingCredit,
      grandTotalIncludingPreviousCredit: calculateGrandTotal(),
    };

    console.log("Printing bill", billData);
    toast.success('Print command sent (check console for bill data)!');
  };

const handleCustomerSubmit = async (customerData) => {
  try {
    setIsCheckingCustomer(true);
    const res = await Api.get(`/customers`, {
      params: { contact: customerData.contact }
    });

    // Axios throws errors for non-2xx responses, so we catch 404 specifically
    toast.info(`Existing customer found: ${res.data.name}`);
    setCustomer({
      id: res.data.id,
      name: res.data.name,
      contact: res.data.contact,
      aadhaar: res.data.aadhaar || '',
      location: res.data.location || '',
    });
    setCustomerOutstandingCredit(res.data.outstandingCredit || 0);
    
  } catch (error) {
    if (error.response?.status === 404) {
      setCustomer({
        id: '',
        name: customerData.name,
        contact: customerData.contact,
        aadhaar: customerData.aadhaar,
        location: customerData.location,
      });
      setCustomerOutstandingCredit(0);
      toast.info('New customer - please enter details to save.');
      customerNameFocusRef.current?.focus();
    } else {
      console.error('Failed to fetch customer details:', error);
      throw new Error('Failed to fetch customer details');
    }
  } finally {
    setIsCheckingCustomer(false);
  }
};
  const handleAddProduct = (product) => {
    setProducts([...products, product]);
  };

  const handleEditProduct = (index, updatedProduct) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

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

  const calculateProductsSubtotal = () => calculateSubtotal() + (calculateGST() + calculateSGST());


  const calculateCurrentBillTotal = () => {
    return calculateProductsSubtotal();
  };

  const calculateGrandTotal = () => {
    // This grand total is for the combined sum displayed in BillSummary.
    // The payment modal will use `currentBillTotal` for the new items
    // and `partialOutstandingPayment` for selected old items.
    return calculateCurrentBillTotal() + customerOutstandingCredit;
  };

  const handleNewCustomer = () => {
    setCustomer({ id: '', name: '', contact: '', aadhaar: '', location: '' });
    setProducts([]);
    setCustomerOutstandingCredit(0);
    setCurrentBill(null);
    toast.info('New bill started!');
  };

  const handleProceedToPayment = () => {
    if (!customer.id && (!customer.name.trim() || customer.contact.length !== 10)) {
      toast.error('Please enter complete customer details before proceeding to payment.');
      return;
    }
    // Allow proceeding to payment if there are products OR if there's outstanding credit
    if (products.length === 0 && customerOutstandingCredit === 0) {
      toast.error('Please add products or resolve outstanding credit before proceeding to payment.');
      return;
    }

    // Pass data for a potential new bill.
    // If only outstanding is being paid, currentBillTotal will be 0, and products will be empty.
    setCurrentBill({
      customer,
      products, // Products for the NEW bill
      productSubtotal: calculateProductsSubtotal(),
      currentBillTotal: calculateCurrentBillTotal(), // Total for the NEW products
      previousOutstandingCredit: customerOutstandingCredit, // Full outstanding
      grandTotal: calculateGrandTotal(), // Combined total, for display/initial payment amount
      date: new Date().toISOString(),
      // Generate a bill number ONLY if there are new products.
      // Otherwise, the backend will handle updates to existing bills.
      billNumber: calculateCurrentBillTotal() > 0 ? `BILL-${customer.id || 'NEW'}-${Date.now()}` : '',
    });
    setShowPaymentModal(true);
  };

const handlePaymentComplete = async (paymentDetails) => {
  if (!currentBill) {
    toast.error('No bill data available for payment. Please try again.');
    return;
  }

  try {
    // Calculate totals
    const productSubtotal = currentBill.products.reduce(
      (sum, product) => sum + (product.totalPrice || 0), 
      0
    );

    // Prepare complete bill data
    const completeBill = {
      customer: {
        id: currentBill.customer.id,
        name: currentBill.customer.name || '',
        contact: currentBill.customer.contact || '',
        aadhaar: currentBill.customer.aadhaar || '',
        location: currentBill.customer.location || ''
      },
      products: currentBill.products.map(p => ({
        name: p.name,
        code: p.code,
        price: p.price,
        quantity: p.quantity,
        unit: p.unit,
        totalPrice: p.totalPrice,
        discount: p.discount || 0
      })),
      productSubtotal,
      currentBillTotal: productSubtotal,
      payment: {
        method: paymentDetails.method || 'cash',
        currentBillPayment: paymentDetails.currentBillPayment || 0,
        selectedOutstandingPayment: paymentDetails.selectedOutstandingPayment || 0,
        transactionId: paymentDetails.transactionId || ''
      },
      billNumber: currentBill.billNumber || `BILL-${Date.now()}`,
      selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds || []
    };

    console.log("Sending bill data:", completeBill);

    // First check stock availability
    for (const product of completeBill.products) {
      const stockCheck = await Api.get(`/products/check-stock/${product.code}`, {
        params: { unit: product.unit, quantity: product.quantity }
      });
      
      if (!stockCheck.data.isAvailable) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    // Then create the bill
    const response = await Api.post('/bills', completeBill);
    
    console.log("Bill created successfully:", response.data);
    toast.success('Payment successful and bill saved!');
    handleFinalClose();

  } catch (error) {
    console.error('Error during payment:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.data);
      toast.error(error.response.data.message || 'Payment failed');
    } else {
      toast.error(error.message || 'Failed to complete payment');
    }
  }

  try {
    // Calculate productSubtotal from products (sum of totalPrice)
    const productSubtotal = currentBill.products.reduce(
      (sum, product) => sum + (product.totalPrice || 0), 
      0
    );

    // Prepare the complete bill data with all required fields
    const completeBill = {
      customer: {
        id: currentBill.customer.id,
        name: currentBill.customer.name || '',
        contact: currentBill.customer.contact || '',
        aadhaar: currentBill.customer.aadhaar || '',
        location: currentBill.customer.location || ''
      },
      products: currentBill.products.map(p => ({
        name: p.name,
        code: p.code,
        price: p.price,
        quantity: p.quantity,
        unit: p.unit,
        totalPrice: p.totalPrice,
        discount: p.discount || 0
      })),
      productSubtotal: productSubtotal,
      currentBillTotal: productSubtotal, // Same as subtotal since we removed GST
      payment: {
        method: paymentDetails.method,
        currentBillPayment: paymentDetails.currentBillPayment,
        selectedOutstandingPayment: paymentDetails.selectedOutstandingPayment || 0,
        transactionId: paymentDetails.transactionId || ''
      },
      billNumber: currentBill.billNumber,
      selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds || []
    };

    console.log("Sending bill data:", completeBill);

    const response = await Api.post('/bills', completeBill);
    
    console.log("Bill created successfully:", response.data);
    toast.success('Payment successful and bill saved!');
    handleFinalClose();

  } catch (error) {
    console.error('Error during payment:', error);
    
    if (error.response) {
      console.error('Server responded with:', error.response.status);
      console.error('Response data:', error.response.data);
      toast.error(error.response.data.message || 'Payment failed');
    } else if (error.request) {
      console.error('No response received:', error.request);
      toast.error('Network error. Please check your connection.');
    } else {
      console.error('Request setup error:', error.message);
      toast.error(error.message || 'Failed to complete payment');
    }
  }
};

  const handleFinalClose = () => {
    setShowPaymentModal(false);
    setCustomer({ id: '', name: '', contact: '', aadhaar: '', location: '' });
    setProducts([]);
    setCustomerOutstandingCredit(0); // This resets it for a new bill/customer session
    setCurrentBill(null);
    toast.info('Ready for a new bill!');
  };

  const handleClosePaymentModal = () => {
  setShowPaymentModal(false);
  // Don't reset any other state here
};

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
            <CustomerDetails
              customer={customer}
              onSubmit={handleCustomerSubmit}
              onEdit={() => toast.info('Customer editing feature coming soon!')}
              isCheckingCustomer={isCheckingCustomer}
              onFocusCustomerName={customerNameFocusRef}
              onFocusPhoneNumber={phoneNumberFocusRef}
            />
            <BillSummary
              products={products}
              customerOutstandingCredit={customerOutstandingCredit}
              currentBillTotal={calculateCurrentBillTotal()}
              grandTotal={calculateGrandTotal()}
              onProceedToPayment={handleProceedToPayment}
              onPrint={handlePrint}
              onTriggerPrint={printRef}
              onTriggerPayment={paymentRef}
            />
          </div>
        </div>
      </div>

      {showPaymentModal && currentBill && (
        <PaymentModal
          currentBillData={currentBill}
            onClose={handleClosePaymentModal} 
          onComplete={handlePaymentComplete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default BillingSystem;