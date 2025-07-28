import React, { useState, useRef } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';
import Api from '../services/api';
import * as ReactDOMClient from 'react-dom/client';
import CashierDetails from './CashierDetails';
import PrintableBill from './PrintableBill';

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
  const [transportCharge, setTransportCharge] = useState(0);
  const printRef = useRef(null);
  const paymentRef = useRef(null);
  const customerNameFocusRef = useRef(null);
  const phoneNumberFocusRef = useRef(null);

  const resetForm = () => {
    setCustomer({
      id: '',
      name: '',
      contact: '',
      aadhaar: '',
      location: '',
    });
    setProducts([]);
    setCustomerOutstandingCredit(0);
    setTransportCharge(0);
    setCurrentBill(null);
  };

 const handlePrint = async () => {
  if (products.length === 0 && customerOutstandingCredit === 0) {
    toast.error('No products or outstanding credit to print in the bill.');
    return;
  }

  try {
    setIsSaving(true);

    // Get cashier details from localStorage
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    const cashier = {
      cashierId: userData.cashierId,
      cashierName: userData.cashierName,
      counterNum: userData.counterNum,
      contactNumber: userData.contactNumber,
    };

    // Prepare bill data
    const billData = {
      customer,
      products,
      cashier,  // Include cashier details
      transportCharge,
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
      },
      selectedUnpaidBillIds: []
    };

    // Rest of the function remains the same...
    // First save the bill
    const response = await Api.post('/bills', billData);
    const savedBill = response.data.bill;

    // Then fetch company details for printing
    const companyRes = await Api.get('/companies');
    const companyDetails = companyRes.data[0];

    // Open print dialog with React 18 syntax
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${savedBill.billNumber}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          <div id="print-root"></div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Render the printable component using React 18's createRoot
    const rootElement = printWindow.document.getElementById('print-root');
    const root = ReactDOMClient.createRoot(rootElement);
    root.render(
      <PrintableBill billData={savedBill} companyDetails={companyDetails} />
    );

    toast.success('Bill saved and printed successfully!');
    resetForm();
  } catch (error) {
    console.error('Print error:', error);
    toast.error('Failed to print bill: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsSaving(false);
  }
};
  const handleTransportChargeChange = (value) => {
    setTransportCharge(value);
  };

  const handleCustomerSubmit = async (customerData) => {
    try {
      setIsCheckingCustomer(true);
      const res = await Api.get(`/customers?contact=${customerData.contact}`);

      const existingCustomer = res.data;
      toast.info(`Existing customer found: ${existingCustomer.name}`);
      setCustomer({
        id: existingCustomer.id,
        name: existingCustomer.name,
        contact: existingCustomer.contact,
        aadhaar: existingCustomer.aadhaar || '',
        location: existingCustomer.location || ''
      });
      setCustomerOutstandingCredit(existingCustomer.outstandingCredit || 0);
    } catch (err) {
      if (err.response?.status === 404) {
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

  const calculateProductsSubtotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    const sgst = calculateSGST();
    return Math.round((subtotal + gst + sgst));
  };

  const calculateCurrentBillTotal = () => {
    const subtotal = calculateProductsSubtotal();
    return Math.round((subtotal + (transportCharge || 0)));
  };

  const calculateGrandTotal = () => {
    return Math.round((calculateCurrentBillTotal() + (customerOutstandingCredit || 0)));
  };

  const handleNewCustomer = () => {
    resetForm();
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
      currentBillTotal: calculateCurrentBillTotal(),
      previousOutstandingCredit: customerOutstandingCredit,
      grandTotal: calculateGrandTotal(),
      date: new Date().toISOString(),
      billNumber: products.length > 0 ? `BILL-${customer.id || 'NEW'}-${Date.now()}` : 'OUTSTANDING-' + Date.now(),
      isOutstandingPaymentOnly: products.length === 0 && customerOutstandingCredit > 0
    });
    setShowPaymentModal(true);
  };

  //   // Pass data for a potential new bill.
  //   // If only outstanding is being paid, currentBillTotal will be 0, and products will be empty.
  //   setCurrentBill({
  //     customer,
  //     products, // Products for the NEW bill
  //     productSubtotal: calculateProductsSubtotal(),
  //     currentBillTotal: calculateCurrentBillTotal(), // Total for the NEW products
  //     previousOutstandingCredit: customerOutstandingCredit, // Full outstanding
  //     grandTotal: calculateGrandTotal(), // Combined total, for display/initial payment amount
  //     date: new Date().toISOString(),
  //     // Generate a bill number ONLY if there are new products.
  //     // Otherwise, the backend will handle updates to existing bills.
  //     billNumber: calculateCurrentBillTotal() > 0 ? `BILL-${customer.id || 'NEW'}-${Date.now()}` : '',
  //   });
  //   setShowPaymentModal(true);
  // };

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

  try {
    // Calculate all required amounts
    const productSubtotal = calculateSubtotal();
    const totalGst = calculateGST();
    const totalSgst = calculateSGST();
    const productTotalWithTax = calculateProductsSubtotal();
    const currentBillTotal = calculateCurrentBillTotal();
    const grandTotal = calculateGrandTotal();
    
    const outstandingPayment = Math.round(paymentDetails.selectedOutstandingPayment);
    const currentPayment = Math.round(paymentDetails.currentBillPayment);
    const unpaidAmountForThisBill = grandTotal - (outstandingPayment + currentPayment);

    const isNewBillPresent = products.length > 0;

    // Prepare complete bill data with all tax and charge details
    const completeBill = {
      customer: {
        id: currentBill.customer.id || null,
        name: currentBill.customer.name || '',
        contact: currentBill.customer.contact || '',
        aadhaar: currentBill.customer.aadhaar || '',
        location: currentBill.customer.location || ''
      },
      ...(isNewBillPresent && {
        products: currentBill.products.map(p => ({
          name: p.name,
          code: p.code,
          mrpPrice:Number(p.mrpPrice),
          price: Number(p.price ),
          quantity: Number(p.quantity ),
          unit: p.unit,
          totalPrice: Number(p.totalPrice ),
          discount: Number(p.discount ),
          basicPrice: Number(p.basicPrice ),
          gst: Number(p.gst ),
          sgst: Number(p.sgst),
          gstAmount: Number(p.gstAmount),
          sgstAmount: Number(p.sgstAmount),
          hsnCode: p.hsnCode
        }))
      }),
      transportCharge: Number(transportCharge || 0),
      productSubtotal: productSubtotal,
      totalGst: totalGst,
      totalSgst: totalSgst,
      productTotalWithTax: productTotalWithTax,
      currentBillTotal: currentBillTotal,
      grandTotal: grandTotal,
      unpaidAmountForThisBill: Math.max(0, unpaidAmountForThisBill),
      payment: {
        method: paymentDetails.method || 'cash',
        currentBillPayment: currentPayment,
        selectedOutstandingPayment: outstandingPayment,
        transactionId: paymentDetails.transactionId || ''
      },
      billNumber: currentBill.billNumber || `BILL-${Date.now()}`,
      selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds || [],
      isOutstandingPaymentOnly: !isNewBillPresent,
      cashier
    };

    const apiUrl = isNewBillPresent ? '/bills' : '/bills/settle-outstanding';
    const response = await Api.post(apiUrl, completeBill);

    if (response.data.success) {
      toast.success('Payment successful and bill saved!');
      handleFinalClose();
    } else {
      throw new Error(response.data.message || 'Payment failed');
    }
  } catch (error) {
    console.error('❌ Error during payment:', error);
    toast.error(error.message || 'Payment failed');
  } finally {
    setIsSaving(false);
  }
};

  const handleFinalClose = () => {
    setShowPaymentModal(false);
    resetForm();
    toast.info('Ready for a new bill!');
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
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
              transportCharge={transportCharge}
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
