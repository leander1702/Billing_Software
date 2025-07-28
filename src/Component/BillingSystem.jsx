import React, { useState, useRef } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';
import Api from '../services/api';
import * as ReactDOMClient from 'react-dom/client';

// Temporary PrintableBill component (define this in a separate file if preferred)
const PrintableBill = ({ billData, companyDetails }) => {
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{companyDetails?.name || 'Company Name'}</h1>
        <p>{companyDetails?.address || 'Company Address'}</p>
        <p>GST: {companyDetails?.gst || 'GST Number'}</p>
      </div>
      
      <div className="border-b-2 border-black mb-4">
        <h2 className="text-xl font-semibold">INVOICE</h2>
        <p>Bill No: {billData.billNumber}</p>
        <p>Date: {new Date(billData.date).toLocaleDateString()}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">Customer Details:</h3>
        <p>Name: {billData.customer.name}</p>
        <p>Contact: {billData.customer.contact}</p>
      </div>
      
      {billData.products?.length > 0 && (
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {billData.products.map((product, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td>{product.name}</td>
                <td className="text-right">{product.quantity} {product.unit}</td>
                <td className="text-right">{product.price.toFixed(2)}</td>
                <td className="text-right">{(product.quantity * product.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="border-t-2 border-black pt-2">
        {billData.transportCharge > 0 && (
          <div className="flex justify-between">
            <span>Transport Charge:</span>
            <span>{billData.transportCharge.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{billData.productSubtotal.toFixed(2)}</span>
        </div>
        {billData.previousOutstandingCredit > 0 && (
          <div className="flex justify-between">
            <span>Previous Outstanding:</span>
            <span>{billData.previousOutstandingCredit.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>Grand Total:</span>
          <span>{billData.grandTotal.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
};

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
      
      // Prepare bill data
      const billData = {
        customer,
        products,
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
      const baseAmount = (item.basicPrice || 0) * (item.quantity || 0);
      return sum + baseAmount;
    }, 0);

  const calculateGST = () =>
    products.reduce((sum, item) => {
      const baseAmount = (item.gstAmount || 0) * (item.quantity || 0);
      return sum + baseAmount;
    }, 0);

  const calculateSGST = () =>
    products.reduce((sum, item) => {
      const baseAmount = (item.sgstAmount || 0) * (item.quantity || 0);
      return sum + baseAmount;
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

  const handlePaymentComplete = async (paymentDetails) => {
    if (!currentBill) {
      toast.error('No bill data available for payment. Please try again.');
      return;
    }

    try {
      const productSubtotal = Math.round(calculateProductsSubtotal());
      const currentBillTotal = Math.round(calculateCurrentBillTotal());
      const grandTotal = Math.round(calculateGrandTotal());
      const outstandingPayment = Math.round((paymentDetails.selectedOutstandingPayment));
      const currentPayment = Math.round((paymentDetails.currentBillPayment));
      const unpaidAmount = grandTotal - (outstandingPayment + currentPayment);

      const completeBill = {
        customer: {
          id: currentBill.customer.id || null,
          name: currentBill.customer.name || '',
          contact: currentBill.customer.contact || '',
          aadhaar: currentBill.customer.aadhaar || '',
          location: currentBill.customer.location || ''
        },
        ...(products.length > 0 && {
          products: currentBill.products.map(p => ({
            name: p.name,
            code: p.code,
            price: Number(p.price || 0),
            quantity: Number(p.quantity || 0),
            unit: p.unit,
            totalPrice: Number(p.totalPrice || 0),
            discount: Number(p.discount || 0),
            basicPrice: Number(p.basicPrice || 0),
            gst: Number(p.gst || 0),
            sgst: Number(p.sgst || 0),
            gstAmount: Number(p.gstAmount || 0),
            sgstAmount: Number(p.sgstAmount || 0),
            hsnCode: p.hsnCode || ''
          }))
        }),
        productSubtotal,
        transportCharge: Number(transportCharge || 0),
        currentBillTotal,
        grandTotal,
        unpaidAmountForThisBill: Math.max(0, unpaidAmount),
        payment: {
          method: paymentDetails.method || 'cash',
          currentBillPayment: currentPayment,
          selectedOutstandingPayment: outstandingPayment,
          transactionId: paymentDetails.transactionId || ''
        },
        billNumber: currentBill.billNumber || `BILL-${Date.now()}`,
        selectedUnpaidBillIds: paymentDetails.selectedUnpaidBillIds || [],
        isOutstandingPaymentOnly: products.length === 0
      };

      if (products.length > 0) {
        for (const product of completeBill.products) {
          const stockCheck = await Api.get(`/products/check-stock/${product.code}`, {
            params: { unit: product.unit, quantity: product.quantity }
          });
          
          if (!stockCheck.data.isAvailable) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }
      }

      const response = await Api.post('/bills', completeBill);
      toast.success('Payment successful and bill saved!');
      resetForm();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error during payment:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Payment failed');
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to complete payment');
      }
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
              transportCharge={transportCharge}
              onTransportChargeChange={setTransportCharge}
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
