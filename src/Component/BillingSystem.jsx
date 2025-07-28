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
  const [transportCharge, setTransportCharge] = useState(0);
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
  const handleTransportChargeChange = (value) => {
    setTransportCharge(value);
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
      return sum + (baseAmount);
    }, 0);

  const calculateGST = () =>
    products.reduce((sum, item) => {
      const baseAmount = (item.gstAmount * item.quantity);
      // const gstAmount = (baseAmount * (item.gst*item.quantity)) / 100;
      return sum + (baseAmount);
    }, 0);

  const calculateSGST = () =>
    products.reduce((sum, item) => {
      const baseAmount = (item.sgstAmount * item.quantity);
      // const gstAmount = (baseAmount * (item.gst*item.quantity)) / 100;
      return sum + (baseAmount);
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

  // const handlePaymentComplete = async (paymentDetails) => {
  //   if (!currentBill) {
  //     toast.error('No bill data available for payment. Please try again.');
  //     return;
  //   }
  // }
  const handlePaymentComplete = async (paymentDetails) => {
    if (!currentBill) {
      toast.error('No bill data available for payment. Please try again.');
      return;
    }

    setIsSaving(true);
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));

    const cashier = {
      cashierId: userData.cashierId,
      cashierName: userData.cashierName,
      counterNum: userData.counterNum,
      contactNumber: userData.contactNumber,
    };

    const productSubtotal = parseFloat(currentBill.productSubtotal?.toFixed(2) || '0');
    const currentBillTotal = parseFloat(currentBill.currentBillTotal?.toFixed(2) || '0');
    const grandTotal = parseFloat(paymentDetails.totalAmountDueForSelected || '0');
    const unpaidAmountForThisBill = Math.max(0, currentBillTotal - (paymentDetails.currentBillPayment || 0));

    const isNewBillPresent = currentBill.products && currentBill.products.length > 0;

    const payload = isNewBillPresent
      ? {
        customer: currentBill.customer,
        products: currentBill.products,
        productSubtotal,
        productGst: 0, // assuming no GST
        currentBillTotal,
        previousOutstandingCredit: currentBill.previousOutstandingCredit || 0,
        grandTotal,
        unpaidAmountForThisBill,
        cashier,
        payment: {
          method: paymentDetails.method,
          amountPaid: paymentDetails.amountPaid,
          transactionId: paymentDetails.transactionId || '',
          currentBillPayment: paymentDetails.currentBillPayment || 0,
          selectedOutstandingPayment: paymentDetails.selectedOutstandingPayment || 0,
        },
        billNumber: currentBill.billNumber,
        date: currentBill.date,
        selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds || [],
      }
      : {
        customerId: customer.id,
        paymentMethod: paymentDetails.method,
        transactionId: paymentDetails.transactionId,
        amountPaid: paymentDetails.amountPaid,
        selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds,
        cashier,
      };

    const apiUrl = isNewBillPresent
      ? 'http://localhost:5000/api/bills'
      : 'http://localhost:5000/api/bills/settle-outstanding';

    console.log(`✅ Sending payload to ${apiUrl}:`, payload);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      console.log('✅ Bill created successfully:', data);
      toast.success('Payment successful and bill saved!');
      handleFinalClose();
    } catch (error) {
      console.error('❌ Error during payment:', error);
      toast.error(error.message || 'Payment failed');
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
      <div className="mx-auto p-1 max-w-full">
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
              transportCharge={transportCharge}
              onTransportChargeChange={handleTransportChargeChange}
            />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-1">
            <CashierDetails />
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