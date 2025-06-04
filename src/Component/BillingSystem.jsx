import { useState } from 'react';
import ProductList from './ProductList';
import CustomerDetails from './CustomerDetails';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';

const BillingSystem = () => {
  const [customerId, setCustomerId] = useState(1000);
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
        alert('Existing customer detected. Auto-filling details.');
        setCustomer({
          id: existing.customer.id,
          name: existing.customer.name,
          contact: existing.customer.contact,
        });
      } else {
        // Get max ID from all bills
        const allIds = bills.map((bill) => parseInt(bill.customer.id)).filter(id => !isNaN(id));
        const maxId = allIds.length > 0 ? Math.max(...allIds) : 1000;
        const newId = maxId + 1;

        setCustomerId(newId);
        setCustomer({
          ...customerData,
          id: newId,
        });
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      alert('Error checking customer. Please try again.');
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const handleEditCustomer = () => {
    console.log('Edit customer initiated');
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
    products.reduce((total, product) => total + product.price * product.quantity, 0);

  const calculateGst = () =>
    products.reduce(
      (total, product) => total + (product.price * product.quantity * (product.gst || 0)) / 100,
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
  };

  const handleProceedToPayment = () => {
    setCurrentBill({
      customer,
      products,
      subtotal: calculateSubtotal(),
      gst: calculateGst(),
      total: calculateTotal(),
      date: new Date().toISOString(),
      billNumber: `BILL-${customer.id || customerId}`,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentDetails) => {
    const completeBill = {
      ...currentBill,
      payment: paymentDetails,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      const res = await fetch('http://localhost:5000/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeBill),
      });

      if (!res.ok) throw new Error('Failed to save bill');

      const data = await res.json();
      console.log('Bill saved:', data);
      alert('Payment successful and bill saved!');
      handleFinalClose();
    } catch (err) {
      console.error('Error saving bill:', err);
      alert('Failed to save bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalClose = () => {
    setShowPaymentModal(false);
    handleNewCustomer();
  };

  return (
    <div className="max-h-screen bg-gradient-to-br from-blue-50 to-blue-100 font-inter">
      <div className="mx-auto px-4 py-2 sm:px-2 lg:px-2">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="lg:w-3/4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <ProductList
              products={products}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onRemove={handleRemoveProduct}
            />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-2">
            <CustomerDetails
              customer={customer}
              onSubmit={handleCustomerSubmit}
              onEdit={handleEditCustomer}
              nextCustomerId={customerId}
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
