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


  const handlePaymentComplete = async (paymentDetails) => {
    setIsSaving(true);
    let apiUrl = '';
    let payload = {};

    // Determine if a new bill is involved or only outstanding bills are being settled
    const isNewBillPresent = (currentBill?.currentBillTotal || 0) > 0;

    if (isNewBillPresent) {
      apiUrl = 'http://localhost:5000/api/bills';
      payload = {
        customer: currentBill.customer,
        products: currentBill.products, // Products for the new bill
        productSubtotal: currentBill.productSubtotal,
        productGst: currentBill.productGst,
        currentBillTotal: currentBill.currentBillTotal, // Total for the new products only
        previousOutstandingCredit: currentBill.previousOutstandingCredit, // Full outstanding customer had before this transaction
        grandTotal: paymentDetails.totalAmountDueForSelected, // This is the total the user is paying for (new + selected outstanding)

        payment: {
          method: paymentDetails.method,
          amountPaid: paymentDetails.amountPaid, // Total amount collected by the user
          transactionId: paymentDetails.transactionId,
          // Explicitly pass amounts allocated to current vs. outstanding by PaymentModal
          currentBillPayment: paymentDetails.currentBillPayment,
          selectedOutstandingPayment: paymentDetails.selectedOutstandingPayment,
        },
        billNumber: currentBill.billNumber, // The new bill number
        date: currentBill.date,
        // The unpaidAmountForThisBill here reflects the unpaid portion of the *new* bill.
        // The backend will manage the unpaidAmountForThisBill for selected old bills.
        unpaidAmountForThisBill: Math.max(0, currentBill.currentBillTotal - paymentDetails.currentBillPayment),
        selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds, // IDs of bills selected for payment
      };
    } else {
      // Scenario 2: Outstanding Bill Payment ONLY (no new bill)
      // This goes to the new dedicated endpoint for settling outstanding bills
      apiUrl = 'http://localhost:5000/api/bills/settle-outstanding';
      payload = {
        customerId: customer.id, // The ID of the customer whose bills are being settled
        paymentMethod: paymentDetails.method,
        transactionId: paymentDetails.transactionId,
        amountPaid: paymentDetails.amountPaid, // The total amount paid for outstanding bills
        selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds,
      };
      // For this scenario, we don't send `products`, `currentBillTotal`, `billNumber` etc.,
      // as no new bill is being created.
    }

    console.log(`✅ Sending payload to ${apiUrl}:`, payload);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST', // Both endpoints currently use POST
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Backend responded with error:', errorData);
        throw new Error(errorData.message || 'Payment processing failed.');
      }

      const data = await res.json();
      console.log('✅ Payment processed successfully:', data);
      toast.success(data.message || 'Payment successful!');

      // ✨ CRUCIAL UPDATE: Update the frontend's customerOutstandingCredit
      // with the value returned from the backend. The backend is the source of truth
      // for the customer's overall outstanding.
      // Adjust this based on what your backend actually returns:
      // If the backend directly returns customer's new outstanding:
      if (data.customerNewOutstandingCredit !== undefined) {
        setCustomerOutstandingCredit(data.customerNewOutstandingCredit);
      } else {
        // If the backend returns updated bill data, you might need to re-fetch customer's data
        // or recalculate outstanding from updatedBills list.
        // For simplicity, let's assume `customerNewOutstandingCredit` is returned by both endpoints.
        // If not, you'd trigger a `fetchCustomerDetails` here.
        console.warn("Backend did not return 'customerNewOutstandingCredit'. Consider re-fetching customer details.");
        // Example: await handleCustomerSubmit({ contact: customer.contact }); // Re-fetch customer data
      }


      handleFinalClose(); // Close modal and reset for new bill (resets outstanding credit too)
    } catch (err) {
      console.error('❌ Error processing payment:', err.message);
      toast.error(`Failed to process payment: ${err.message}. Please try again.`);
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
            />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-1">
            {/* <CashierDetails /> */}
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