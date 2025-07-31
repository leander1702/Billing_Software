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

    const calculateTotals = () => {
        const products = billData.products || [];
        let subtotal = 0;
        let gstTotal = 0;
        let sgstTotal = 0;
        let taxTotal = 0;

        if (products.length > 0) {
            subtotal = Math.round(products.reduce((sum, product) => {
                const price = Math.round((product.basicPrice || 0) * 100) / 100;
                const qty = product.quantity || 1;
                return sum + (price * qty);
            }, 0) * 100) / 100;

            gstTotal = Math.round(products.reduce((sum, product) => {
                const tax = Math.round((product.gstAmount || 0) * 100) / 100;
                const qty = product.quantity || 1;
                return sum + (tax * qty);
            }, 0) * 100) / 100;

            sgstTotal = Math.round(products.reduce((sum, product) => {
                const tax = Math.round((product.sgstAmount || 0) * 100) / 100;
                const qty = product.quantity || 1;
                return sum + (tax * qty);
            }, 0) * 100) / 100;

            taxTotal = Math.round((gstTotal + sgstTotal) * 100) / 100;
        }

        const transport = Math.round((billData.transportCharge || 0) * 100) / 100;
        const credit = Math.round((billData.previousOutstandingCredit || 0) * 100) / 100;
        const grandTotal = Math.round((subtotal + taxTotal + transport + credit) * 100) / 100;

        // Calculate payment details
        const currentPayment = billData.payment?.currentBillPayment || 0;
        const outstandingPayment = billData.payment?.selectedOutstandingPayment || 0;
        const totalPaid = Math.round((currentPayment + outstandingPayment) * 100) / 100;
        const balanceDue = Math.round((grandTotal - totalPaid) * 100) / 100;

        return {
            subtotal,
            gstTotal,
            sgstTotal,
            taxTotal,
            transport,
            credit,
            grandTotal,
            currentPayment,
            outstandingPayment,
            totalPaid,
            balanceDue,
            hasProducts: products.length > 0
        };
    };

    const totals = calculateTotals();

    const getBillNumber = () => {
        return billData.billNumber || (billData.isOutstandingPaymentOnly
            ? `CREDIT-${new Date().getTime()}`
            : `BILL-${new Date().getTime()}`);
    };

    // Helper function to safely display values
    const displayValue = (value, fallback = '') => {
        return value !== undefined && value !== null ? value : fallback;
    };

    // Format percentage values
    const formatPercentage = (value) => {
        if (value === undefined || value === null) return '0';
        return `${Math.round(value * 100) / 100}`;
    };

    return (
        <div className="p-5 w-[210mm] h-[297mm] mx-auto font-sans bg-white" style={{ fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header Section */}
            <div className='flex justify-between'>
                <p className="font-semibold">GSTIN: {displayValue(companyDetails.gstin, 'N/A')}</p>
                <p className="font-semibold mt-2">{billData.isOutstandingPaymentOnly ? 'Credit Settlement' : 'Original for Buyer'}</p>
            </div>
            <div className="text-center mb-4">
                {companyDetails.logoUrl && (
                    <div className="flex justify-center mb-2">
                        <img
                            src={companyDetails.logoUrl}
                            alt="Company Logo"
                            className="h-16 object-contain"
                        />
                    </div>
                )}
                <h2 className="text-xl font-semibold mb-1">{displayValue(companyDetails.businessName)}</h2>
                <p className="mb-1">{displayValue(companyDetails.address)}</p>
                <p className="mb-1">
                    Phone No: {displayValue(companyDetails.phoneNumber, 'N/A')},
                    Email: {displayValue(companyDetails.email, 'N/A')}
                </p>
            </div>

            {/* Bill Info Section */}
            <div className="flex justify-between mb-1 border-b border-black pb-2">
                <div>
                    <h3 className="font-semibold mb-[2px] text-md">Customer Details:</h3>
                    <p><span className="font-semibold">Customer Name:</span> {displayValue(billData.customer?.name, 'N/A')}</p>
                    <p><span className="font-semibold">Customer Phone No:</span> {displayValue(billData.customer?.contact, 'N/A')}</p>
                    <p><span className="font-semibold">Customer Location:</span> {displayValue(billData.customer?.location, 'N/A')}</p>
                    <p><span className="font-semibold">Aadhaar:</span> {displayValue(billData.customer?.aadhaar, 'N/A')}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold mb-[2px] text-md">Cashier Details:</h3>
                    <p><span className="font-semibold">Receipt No:</span> {getBillNumber()}</p>
                    <p><span className="font-semibold">Cashier Name:</span> {displayValue(billData.cashier?.cashierName, 'N/A')}</p>
                    <p><span className="font-semibold">Counter No:</span> {displayValue(billData.cashier?.counterNum, 'N/A')}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(billData.date || new Date()).toLocaleDateString('en-IN')}</p>
                </div>
            </div>

            {/* Only show product table if there are products */}
            {totals.hasProducts && (
                <div className="mb-2">
                    <h3 className="font-semibold mb-2 text-lg">Bill Details:</h3>
                    <table className="w-full border">
                        <thead>
                            <tr>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>SNO</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>Product Code</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>Product Name</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>MRP</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>Basic Price</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>GST %</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>SGST %</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>Qty/Unit</th>
                                <th className="text-center py-1 font-semibold border border-black bg-gray-100" style={{ fontSize: '10px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(billData.products || []).map((product, index) => {
                                const quantity = product.quantity || 1;
                                const unit = product.unit || '';
                                const basicPrice = Math.round((product.basicPrice || 0) * 100) / 100;
                                const total = Math.round((basicPrice * quantity) + (product.gstAmount * quantity) + (product.sgstAmount * quantity));

                                return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="text-center py-1 border-l border-r border-black" style={{ fontSize: '10px' }}>{index + 1}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{displayValue(product.code)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{displayValue(product.name)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{formatCurrency(product.mrpPrice)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{formatCurrency(basicPrice)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{formatPercentage(product.gstAmount)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>{formatPercentage(product.sgstAmount)}</td>
                                        <td className="text-center py-1 border-r border-black" style={{ fontSize: '10px' }}>
                                            {quantity}{unit}
                                        </td>
                                        <td className="text-center py-1 border-r border-black font-semibold" style={{ fontSize: '10px' }}>
                                            {formatCurrency(total)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="mt-2 flex justify-between">
                        <p><span className="font-semibold">Delivery Charges:</span> {formatCurrency(billData.transportCharge)}</p>
                        <p><span className="font-semibold">Item Count:</span> {(billData.products || []).length}</p>
                    </div>
                </div>
            )}

            {/* Totals Section */}
            <div className="mb-2 text-right">
                {totals.hasProducts && (
                    <>
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
                            <span>{formatCurrency(totals.transport)}</span>
                        </div>
                    </>
                )}

                <div className="flex justify-between mb-1">
                    <span>Previous Credit:</span>
                    <span>{formatCurrency(totals.credit)}</span>
                </div>

                <div className="mt-1 mb-1">
                    <span className="font-bold text-md text-right">{billData.isOutstandingPaymentOnly ? 'Total Credit:' : 'Grand Total:'}</span>
                    <span className="font-bold text-lg">{formatCurrency(totals.grandTotal)}</span>
                </div>

                {/* Payment Details Section */}
                {billData.payment && (
                    <>
                        {!billData.isOutstandingPaymentOnly && (
                            <div className="flex justify-between border-t border-black pt-2">
                                <span className="font-semibold">Current Bill Payment:</span>
                                <span>{formatCurrency(totals.currentPayment)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="font-semibold">Credit Payment:</span>
                            <span>{formatCurrency(totals.outstandingPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Total Paid:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totals.totalPaid)}</span>
                        </div>
                        {totals.balanceDue > 0 && (
                            <div className="flex justify-between">
                                <span className="font-semibold">Balance Due:</span>
                                <span className="font-semibold text-red-600">{formatCurrency(totals.balanceDue)}</span>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-2 border-t border-black pt-2">
                    <p className="font-semibold">Amount In Words: {numberToWords(totals.grandTotal)}</p>
                </div>
            </div>

            {/* Payment Method Section */}
            {billData.payment && (
                <div className="mb-1">
                    <p><span className="font-semibold">Payment Method:</span> {billData.payment.method.toUpperCase()}</p>
                    {billData.payment.transactionId && (
                        <p><span className="font-semibold">Transaction ID:</span> {billData.payment.transactionId}</p>
                    )}
                </div>
            )}

            {/* Terms & Conditions Section */}
            <div className='flex justify-between border-t border-black'>
                {/* <div className="mb-2 pt-2">
                    <h3 className="font-semibold mb-1 text-lg">Terms & Conditions:</h3>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Goods once sold cannot be taken back or exchanged.</li>
                        <li>Warranty and guarantee will be as per manufacturer's policy.</li>
                        <li>All disputes are subject to Tingpur jurisdiction only.</li>
                    </ol>
                </div> */}
                <div className="mt-8 text-center">
                    <p className="font-semibold text-right">Authorized Signatory</p>
                    <div className="mt-2 inline-block border-t border-black pt-1">
                        <p>Stamp & Signature</p>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="text-center border-t border-black pt-4">
                <p className="mb-4">Thank You for Your Business!</p>
            </div>
        </div>
    );
};

export default PrintableBill;