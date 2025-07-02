import { useState } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';
import CashierDetails from './CashierDetails';

const BillingSystem = () => {
  // customerId is now derived, or used as a placeholder for new customer ID generation
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

  // Handle new or existing customer
  const handleCustomerSubmit = async (customerData) => {
    try {
      setIsCheckingCustomer(true);
      const res = await fetch('http://localhost:5000/api/bills');
      if (!res.ok) throw new Error('Failed to fetch bills');
      const bills = await res.json();

      // Check for existing customer
      const existing = bills.find(
        (bill) => bill.customer.contact === customerData.contact
      );

      if (existing) {
        toast.info('Existing customer detected. Auto-filling details.'); // Changed to toast.info
        setCustomer({
          id: existing.customer.id,
          name: existing.customer.name,
          contact: existing.customer.contact,
        });
      } else {
        // Get max ID from all bills. Filter for valid numbers to prevent NaN issues.
        const allCustomerIds = bills.map((bill) => parseInt(bill.customer.id)).filter(id => !isNaN(id));
        const maxId = allCustomerIds.length > 0 ? Math.max(...allCustomerIds) : 1000;
        const newId = maxId + 1;

        setCustomer({
          ...customerData,
          id: newId.toString(), // Ensure ID is string if your backend expects it as such
        });
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      toast.error('Error checking customer. Please try again.');
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const handleEditCustomer = () => {
    // Implement actual customer editing logic here if needed.
    // For now, it just logs.
    console.log('Edit customer initiated');
    toast.info('Customer editing feature coming soon!'); // Example feedback
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
    products.reduce((total, product) => total + product.price, 0); // Changed to product.price

  const calculateGst = () =>
    products.reduce(
      (total, product) => total + (product.price * (product.gst || 0)) / 100, // Changed to product.price
      0
    );

  const calculateTotal = () => calculateSubtotal() + calculateGst();

  const handleNewCustomer = () => {
    setCustomer({
      id: '',
      name: '',
      contact: '',
    });
    setProducts([]);
    setCurrentBill(null); // Clear current bill on new customer
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
      // Ensure customer.id is present before forming billNumber
      billNumber: `BILL-${customer.id || 'N/A'}`,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentDetails) => {
    if (!currentBill) {
      toast.error('No bill data available for payment. Please try again.');
      return;
    }

    // Use values from currentBill, which should be pre-calculated
    const completeBill = {
      customer: currentBill.customer,
      products: currentBill.products,
      subtotal: currentBill.subtotal,
      gst: currentBill.gst,
      total: currentBill.total, // Use the pre-calculated total
      payment: {
        method: paymentDetails.method,
        amountPaid: paymentDetails.amountPaid,
        transactionId: paymentDetails.transactionId || '',
      },
      billNumber: currentBill.billNumber, // Use the pre-calculated bill number
      date: currentBill.date, // Use the pre-calculated date
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
      handleFinalClose();
    } catch (err) {
      console.error('❌ Error saving bill:', err.message);
      toast.error(`Failed to save bill: ${err.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalClose = () => {
    setShowPaymentModal(false);
    handleNewCustomer();
  };

  const nextCustomerIdDisplay = customer.id || 'New Customer';

  return (
    <div className=" bg-gradient-to-br from-blue-50 to-blue-100 font-inter">
      <div className="mx-auto p-2"> {/* Added p-2 for overall padding */}
        <div className="flex flex-col lg:flex-row gap-2"> {/* Increased gap for better spacing */}
          <div className="lg:w-3/4"> {/* ProductList takes 3/4 width         on large screens */}
            <ProductList
              products={products}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onRemove={handleRemoveProduct}
            />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-2"> {/* Right section takes 1/4 width, vertically stacked */}
            <CashierDetails />
            <CustomerDetails
              customer={customer}
              onSubmit={handleCustomerSubmit}
              onEdit={handleEditCustomer}
              nextCustomerId={nextCustomerIdDisplay}
              isCheckingCustomer={isCheckingCustomer}
            />
            <BillSummary
              customer={customer}
              products={products}
              subtotal={calculateSubtotal()}
              gst={calculateGst()}
              total={calculateTotal()}
              onNewCustomer={handleNewCustomer}
              onProceedToPayment={handleProceedToPayment}
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