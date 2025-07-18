// Component/BillingSystem.jsx
import React, { useState, useRef } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';

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
  const [currentBill, setCurrentBill] = useState(null);
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
      productGst: calculateProductsGst(),
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
      const res = await fetch(`http://localhost:5000/api/customers?contact=${customerData.contact}`);
      if (!res.ok) {
        if (res.status === 404) {
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
          throw new Error('Failed to fetch customer details');
        }
      } else {
        const existingCustomer = await res.json();
        toast.info(`Existing customer found: ${existingCustomer.name}`);
        setCustomer({
          id: existingCustomer.id,
          name: existingCustomer.name,
          contact: existingCustomer.contact,
          aadhaar: existingCustomer.aadhaar || '',
          location: existingCustomer.location || '',
        });
        // This is correct: Set the outstanding credit from the fetched customer data
        setCustomerOutstandingCredit(existingCustomer.outstandingCredit || 0);
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      toast.error('Error checking customer. Please try again.');
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

  const calculateProductsSubtotal = () =>
    products.reduce((total, product) => (product.price * product.quantity) || 0, 0);

  const calculateProductsGst = () =>
    products.reduce(
      (total, product) => {
        const base = (product.price * product.quantity) || 0;
        const discountAmount = base * (product.discount / 100 || 0);
        const priceAfterDiscount = base - discountAmount;
        return total + (priceAfterDiscount * (product.gst / 100 || 0));
      },
      0
    );

  const calculateCurrentBillTotal = () => {
    return calculateProductsSubtotal() + calculateProductsGst();
  };

  const calculateGrandTotal = () => {
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
    if (products.length === 0 && customerOutstandingCredit === 0) {
      toast.error('Please add products or resolve outstanding credit before proceeding to payment.');
      return;
    }

    setCurrentBill({
      customer,
      products,
      productSubtotal: calculateProductsSubtotal(),
      productGst: calculateProductsGst(),
      currentBillTotal: calculateCurrentBillTotal(),
      previousOutstandingCredit: customerOutstandingCredit,
      grandTotal: calculateGrandTotal(),
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

    const { amountPaid } = paymentDetails;
    const { grandTotal } = currentBill; // Grand total including previous credit and current products

    // This calculation is correct for determining the unpaid amount FOR THIS TRANSACTION,
    // which will be stored in the bill record.
    // The actual customer outstanding credit will be determined by the backend.
    let unpaidAmountForThisTransactionRecord = 0;
    if (amountPaid < grandTotal) {
      unpaidAmountForThisTransactionRecord = grandTotal - amountPaid;
    } else {
        unpaidAmountForThisTransactionRecord = 0;
    }

    // Prepare the bill data to send to the backend
    const completeBill = {
      customer: currentBill.customer,
      products: currentBill.products,
      productSubtotal: currentBill.productSubtotal,
      productGst: currentBill.productGst,
      currentBillTotal: currentBill.currentBillTotal,
      previousOutstandingCredit: currentBill.previousOutstandingCredit,
      grandTotal: grandTotal,
      payment: {
        method: paymentDetails.method,
        amountPaid: parseFloat(amountPaid),
        transactionId: paymentDetails.transactionId || '',
      },
      billNumber: currentBill.billNumber,
      date: currentBill.date,
      // Send this calculated value to the backend for the Bill record
      unpaidAmountForThisBill: unpaidAmountForThisTransactionRecord,
    };

    console.log("✅ Sending completeBill to backend:", completeBill);

    try {
      setIsSaving(true);

      const res = await fetch('http://localhost:5000/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeBill),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Backend responded with error:', errorData);
        throw new Error(errorData.message || 'Failed to save bill');
      }

      const data = await res.json();
      console.log('✅ Bill saved successfully:', data);
      toast.success('Payment successful and bill saved!');

      // ✨ CRUCIAL UPDATE: Update the frontend's customerOutstandingCredit
      // with the value returned from the backend. The backend is the source of truth.
      setCustomerOutstandingCredit(data.customerNewOutstandingCredit);
      handleFinalClose(); // Close modal and reset for new bill (resets outstanding credit too)
    } catch (err) {
      console.error('❌ Error saving bill:', err.message);
      toast.error(`Failed to save bill: ${err.message}. Please try again.`);
    } finally {
      setIsSaving(false);
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
          onClose={handleFinalClose}
          onComplete={handlePaymentComplete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default BillingSystem;