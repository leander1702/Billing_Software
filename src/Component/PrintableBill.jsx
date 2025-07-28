import React from 'react';

const PrintableBill = ({ billData = {}, companyDetails = {} }) => {
  // Format currency (assuming INR) with 2 decimal places
  const formatCurrency = (amount) => {
    const roundedAmount = Math.round((amount || 0) * 100) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(roundedAmount).replace('₹', '');
  };

  // Enhanced number to words converter
  const numberToWords = (num) => {
    num = Math.round(num || 0); // Round to nearest integer and default to 0 if undefined
    if (num === 0) return 'Zero Rupees Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    function convertLessThanOneThousand(num) {
      if (num === 0) return '';
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
        return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      }
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + convertLessThanOneThousand(num % 100) : '');
    }
    
    let result = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    
    if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (num > 0) result += convertLessThanOneThousand(num);
    
    return result.trim() + ' Rupees Only';
  };

  // Calculate totals with proper fallbacks and rounding
  const calculateTotals = () => {
    const products = billData.products || [];
    const subtotal = Math.round(products.reduce((sum, product) => {
      const price = Math.round((product.basicPrice || 0) * 100) / 100;
      const qty = product.quantity || 1;
      return sum + (price * qty);
    }, 0) * 100) / 100;

    const gstTotal = Math.round(products.reduce((sum, product) => {
      const tax = Math.round((product.gstAmount || 0) * 100) / 100;
      const qty = product.quantity || 1;
      return sum + (tax * qty);
    }, 0) * 100) / 100;

    const sgstTotal = Math.round(products.reduce((sum, product) => {
      const tax = Math.round((product.sgstAmount || 0) * 100) / 100;
      const qty = product.quantity || 1;
      return sum + (tax * qty);
    }, 0) * 100) / 100;

    const taxTotal = Math.round((gstTotal + sgstTotal) * 100) / 100;
    const transport = Math.round((billData.transportCharge || 0) * 100) / 100;
    const credit = Math.round((billData.previousOutstandingCredit || 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + taxTotal + transport + credit) * 100) / 100;
    
    return {
      subtotal,
      gstTotal,
      sgstTotal,
      taxTotal,
      grandTotal
    };
  };

  const totals = calculateTotals();

  // Generate bill number if not provided
  const getBillNumber = () => {
    return billData.billNumber || `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
  };

  // Helper function to safely display values
  const displayValue = (value, fallback = '') => {
    return value !== undefined && value !== null ? value : fallback;
  };

  // Format percentage values
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${Math.round(value * 100) / 100}%`;
  };

  return (
    <div className="p-5 w-[210mm] h-[297mm] mx-auto font-sans bg-white" style={{ fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className='flex justify-between'>
        <p className="font-semibold">GSTIN: {displayValue(companyDetails.gstin, 'N/A')}</p>
        <h1 className="text-2xl font-bold mb-1">INVOICE</h1>
        <p className="font-semibold mt-2">Original for Buyer</p>
      </div>
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold mb-1">{displayValue(companyDetails.businessName)}</h2>
        <p className="mb-1">{displayValue(companyDetails.address)}</p>
        <p className="mb-1">
          Phone No: {displayValue(companyDetails.phoneNumber, 'N/A')}, 
          Email: {displayValue(companyDetails.email, 'N/A')}
        </p>
      </div>

      {/* Bill Info Section */}
      <div className="flex justify-between mb-4 border-b-2 border-black pb-2">
        <div>
          <h3 className="font-semibold mb-[2px] text-md">Customer Details:</h3>
          <p><span className="font-semibold">Customer Name:</span> {displayValue(billData.customer?.name, 'N/A')}</p>
          <p><span className="font-semibold">Customer Phone No:</span> {displayValue(billData.customer?.contact, 'N/A')}</p>
          <p><span className="font-semibold">Customer Location:</span> {displayValue(billData.customer?.location, 'N/A')}</p>
          <p><span className="font-semibold">Aadhaar:</span> {displayValue(billData.customer?.aadhaar, 'N/A')}</p>
        </div>
        <div className="text-right">
          <h3 className="font-semibold mb-[2px] text-md">Cashier Details:</h3>  
          <p><span className="font-semibold">Bill No:</span> {getBillNumber()}</p>
          <p><span className="font-semibold">Cashier Name:</span> {displayValue(billData.cashier?.cashierName, 'N/A')}</p>
          <p><span className="font-semibold">Counter No:</span> {displayValue(billData.cashier?.counterNum, 'N/A')}</p>
          <p><span className="font-semibold">Date:</span> {new Date(billData.date || new Date()).toLocaleDateString('en-IN')}</p>  
        </div>
      </div>

      {/* Bill Details Table */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-lg">Bill Details:</h3>
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="text-center py-1 font-semibold border border-gray-400">SNO</th>
              <th className="text-center py-1 font-semibold border border-gray-400">Product Code</th>
              <th className="text-center py-1 font-semibold border border-gray-400">Product Name</th>
              <th className="text-center py-1 font-semibold border border-gray-400">MRP</th>
              <th className="text-center py-1 font-semibold border border-gray-400">Basic Price</th>
              <th className="text-center py-1 font-semibold border border-gray-400">GST %</th>
              <th className="text-center py-1 font-semibold border border-gray-400">SGST %</th>
              <th className="text-center py-1 font-semibold border border-gray-400">Qty/Unit</th>
              <th className="text-center py-1 font-semibold border border-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {(billData.products || []).map((product, index) => {
              const quantity = product.quantity || 1;
              const unit = product.unit || '';
              const basicPrice = Math.round((product.basicPrice || 0) * 100) / 100;
              const total = Math.round(basicPrice * quantity * 100) / 100;
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="text-center py-1 border border-gray-400">{index + 1}</td>
                  <td className="text-center py-1 border border-gray-400">{displayValue(product.code)}</td>
                  <td className="text-center py-1 border border-gray-400">{displayValue(product.name)}</td>
                  <td className="text-right py-1 border border-gray-400">{formatCurrency(product.mrpPrice)}</td>
                  <td className="text-right py-1 border border-gray-400">{formatCurrency(basicPrice)}</td>
                  <td className="text-center py-1 border border-gray-400">{formatPercentage(product.gstAmount)}</td>
                  <td className="text-center py-1 border border-gray-400">{formatPercentage(product.sgstAmount)}</td>
                  <td className="text-center py-1 border border-gray-400">
                    {quantity}{unit}
                  </td>
                  <td className="text-right py-1 border border-gray-400 font-semibold">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-2">
          <p><span className="font-semibold">Delivery Charges:</span> {formatCurrency(billData.transportCharge)}</p>
          <p><span className="font-semibold">Item Count:</span> {(billData.products || []).length}</p>
        </div>
      </div>

      {/* Totals Section */}
      <div className="mb-4 text-right">
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>GST:</span>
          <span>{formatCurrency(totals.gstTotal)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>SGST:</span>
          <span>{formatCurrency(totals.sgstTotal)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Delivery Charges:</span>
          <span>{formatCurrency(billData.transportCharge)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Previous Credit:</span>
          <span>{formatCurrency(billData.previousOutstandingCredit)}</span>
        </div>

        <div className="mt-2 mb-2">
          <span className="font-bold text-md text-right">Grand Total:</span>
        </div>

        <div className="flex justify-between border-t-2 border-black pt-2">
          <p className="font-semibold">Bill Amount In Words: {numberToWords(totals.grandTotal)}</p>
          <span className="font-bold text-lg">{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>

      {/* Terms & Conditions Section */}
      <div className="mb-4 border-t-2 border-black pt-2">
        <h3 className="font-semibold mb-1 text-lg">Terms & Conditions:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Goods once sold cannot be taken back or exchanged.</li>
          <li>Warranty and guarantee will be as per manufacturer's policy.</li>
          <li>All disputes are subject to Tingpur jurisdiction only.</li>
        </ol>
      </div>

      {/* Footer Section */}
      <div className="text-center border-t-2 border-black pt-4">
        <p className="mb-4">Thank You for Your Purchase! We Appreciate Your Business.</p>
        <div className="mt-8">
          <p className="font-semibold">Authorized Signatory</p>
          <div className="mt-8 border-t border-black w-1/3 mx-auto pt-1">
            <p>Stamp & Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableBill;