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

    // Split products into chunks for pagination (12 per page)
    const productsPerPage = 15;
    const productChunks = [];
    const allProducts = billData.products || [];

    for (let i = 0; i < allProducts.length; i += productsPerPage) {
        productChunks.push(allProducts.slice(i, i + productsPerPage));
    }

    return (
        <div className="w-[210mm] h-[297mm] mx-auto font-sans bg-white" style={{
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            position: 'relative'
        }}>
            {/* Each page will render the header and then the content */}
            {productChunks.length === 0 ? (
                // Single page when there are no products
                <div className="p-5 h-full flex flex-col border border-black">
                    {/* Header Section */}
                    <div className="mb-1">
                        <div className='flex justify-between'>
                            <p className="font-semibold">GSTIN: {displayValue(companyDetails.gstin, 'N/A')}</p>
                        </div>
                        <div className="text-center mb-1">
                            {companyDetails.logoUrl && (
                                <div className="mb-1">
                                    <img
                                        src={companyDetails.logoUrl}
                                        alt="Company Logo"
                                        className="h-10 object-contain"
                                    />
                                </div>
                            )}
                            <h2 className="text-lg font-bold">{displayValue(companyDetails.businessName)}</h2>
                            <p className="text-xs">{displayValue(companyDetails.address)}</p>
                            <p className="text-xs">
                                Phone: {displayValue(companyDetails.phoneNumber, 'N/A')},
                                Email: {displayValue(companyDetails.email, 'N/A')}
                            </p>
                        </div>
                        {/* Bill Info Section */}
                        <div className="flex justify-between">
                            <div className="border border-gray-400 p-1 w-1/2 m-1">
                                <h3 className="font-semibold text-center bg-gray-100 mb-1">Customer Details</h3>
                                <p><span className="font-semibold">Name:</span> {displayValue(billData.customer?.name, 'N/A')}</p>
                                <p><span className="font-semibold">Phone:</span> {displayValue(billData.customer?.contact, 'N/A')}</p>
                                <p><span className="font-semibold">Location:</span> {displayValue(billData.customer?.location, 'N/A')}</p>
                                <p><span className="font-semibold">Aadhaar:</span> {displayValue(billData.customer?.aadhaar, 'N/A')}</p>
                            </div>
                            <div className="border border-gray-400 p-1 w-1/2 m-1">
                                <h3 className="font-semibold text-center bg-gray-100 mb-1">Cashier Details</h3>
                                <p><span className="font-semibold">Receipt No:</span> {getBillNumber()}</p>
                                <p><span className="font-semibold">Cashier:</span> {displayValue(billData.cashier?.cashierName, 'N/A')}</p>
                                <p><span className="font-semibold">Counter:</span> {displayValue(billData.cashier?.counterNum, 'N/A')}</p>
                                <p><span className="font-semibold">Date:</span> {new Date(billData.date || new Date()).toLocaleDateString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="border border-black p-1 mb-1">
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold">Previous Credit:</span>
                                <span>{formatCurrency(totals.credit)}</span>
                            </div>

                            <div className="mt-1 mb-1 border-t border-black pt-1">
                                <span className="font-bold text-md">{billData.isOutstandingPaymentOnly ? 'Total Credit:' : 'Grand Total:'}</span>
                                <span className="font-bold float-right">{formatCurrency(totals.grandTotal)}</span>
                            </div>

                            {/* Payment Details Section */}
                            {billData.payment && (
                                <div className="border-t border-black pt-1">
                                    {!billData.isOutstandingPaymentOnly && (
                                        <div className="flex justify-between">
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
                                        <span className="font-bold text-black-600">{formatCurrency(totals.totalPaid)}</span>
                                    </div>
                                    {totals.balanceDue > 0 && (
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Balance Due:</span>
                                            <span className="font-bold text-red-600">{formatCurrency(totals.balanceDue)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Method Section */}
                        {billData.payment && (
                            <div className='flex justify-between mt-1'>
                                <div className="">
                                    <p><span className="font-semibold">Payment Method:</span> {billData.payment.method.toUpperCase()}</p>
                                    {billData.payment.transactionId && (
                                        <p><span className="font-semibold">Transaction ID:</span> {billData.payment.transactionId}</p>
                                    )}
                                </div>
                                <div className="">
                                    <p className="text-[10px]">Amount In Words: {numberToWords(totals.grandTotal)}</p>
                                </div>
                            </div>
                        )}

                        {/* Footer Section */}
                        <div className="border-t border-black p-1 mt-auto flex justify-between">
                            <div className="mb-1 ">
                                <h3 className="font-semibold mb-1">Company's Bank Details:</h3>
                                <p className="text-xs">Bank Name: {displayValue(companyDetails.bankName, '')}</p>
                                <p className="text-xs">Account No: {displayValue(companyDetails.accountNumber, '')}</p>
                                <p className="text-xs">IFSC: {displayValue(companyDetails.ifscCode, '')}</p>
                            </div>
                            <div className="">
                                <p className="font-semibold pt-14">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Multiple pages when there are products
                productChunks.map((products, pageIndex) => (
                    <div key={pageIndex} className={`p-5 h-full flex flex-col border border-black ${pageIndex > 0 ? 'mt-4' : ''}`}
                        style={{
                            pageBreakAfter: pageIndex < productChunks.length - 1 ? 'always' : 'auto',
                            pageBreakInside: 'avoid'
                        }}>
                        {/* Header Section - Fixed on every page */}
                        <div className="mb-1">
                            <div className='flex justify-between'>
                                <p className="font-semibold">GSTIN: {displayValue(companyDetails.gstin, 'N/A')}</p>
                                {pageIndex > 0 && (
                                    <p className="font-semibold text-red-500">(continuation)</p>
                                )}
                            </div>
                            <div className="text-center mb-1">
                                {companyDetails.logoUrl && (
                                    <div className="flex justify-center">
                                        <img
                                            src={companyDetails.logoUrl}
                                            alt="Company Logo"
                                            className="h-10 object-contain"
                                        />
                                    </div>
                                )}
                                <h2 className="text-lg font-semibold">{displayValue(companyDetails.businessName)}</h2>
                                <p className="text-xs">{displayValue(companyDetails.address)}</p>
                                <p className="text-xs">
                                    Phone: {displayValue(companyDetails.phoneNumber, 'N/A')},
                                    Email: {displayValue(companyDetails.email, 'N/A')}
                                </p>
                            </div>
                            {/* Bill Info Section */}

                            <div className="flex justify-between">
                                <div className="border border-black p-2 w-1/2 m-1">
                                    <h3 className="font-semibold text-center bg-gray-100 mb-1">Customer Details</h3>
                                    <p><span className="font-semibold">Name:</span> {displayValue(billData.customer?.name, 'N/A')}</p>
                                    <p><span className="font-semibold">Phone:</span> {displayValue(billData.customer?.contact, 'N/A')}</p>
                                    <p><span className="font-semibold">Location:</span> {displayValue(billData.customer?.location, 'N/A')}</p>
                                    <p><span className="font-semibold">Aadhaar:</span> {displayValue(billData.customer?.aadhaar, 'N/A')}</p>
                                </div>
                                <div className="border border-black p-1 w-1/2 m-1">
                                    <h3 className="font-semibold text-center bg-gray-100 mb-1">Cashier Details</h3>
                                    <p><span className="font-semibold">Receipt No:</span> {getBillNumber()}</p>
                                    <p><span className="font-semibold">Cashier:</span> {displayValue(billData.cashier?.cashierName, 'N/A')}</p>
                                    <p><span className="font-semibold">Counter:</span> {displayValue(billData.cashier?.counterNum, 'N/A')}</p>
                                    <p><span className="font-semibold">Date:</span> {new Date(billData.date || new Date()).toLocaleDateString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Products Table Section */}
                            <h3 className="font-semibold text-left bg-gray-100 ml-1">Bill Details</h3>
                            <div className="mb-1 flex-grow">
                                <table className="w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="border border-black">
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>SNO</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>Product Code</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>Product Name</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>MRP</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>Basic Price</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>CGST %</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>SGST %</th>
                                            <th className="text-center py-1 font-semibold border-r border-black bg-gray-100" style={{ fontSize: '12px' }}>Qty/Unit</th>
                                            <th className="text-center py-1 font-semibold bg-gray-100" style={{ fontSize: '12px' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => {
                                            const quantity = product.quantity || 1;
                                            const unit = product.unit || '';
                                            const basicPrice = Math.round((product.basicPrice || 0) * 100) / 100;
                                            const total = Math.round((basicPrice * quantity) + (product.gstAmount * quantity) + (product.sgstAmount * quantity));

                                            return (
                                                <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                                    <td className="text-center py-1 border-r border-l border-black" style={{ fontSize: '12px' }}>
                                                        {pageIndex * productsPerPage + index + 1}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black" style={{ fontSize: '12px' }}>
                                                        {displayValue(product.code)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black font-bold" style={{ fontSize: '12px' }}>
                                                        {displayValue(product.name)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black" style={{ fontSize: '12px' }}>
                                                        {formatCurrency(product.mrpPrice)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black" style={{ fontSize: '12px' }}>
                                                        {formatCurrency(basicPrice)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black" style={{ fontSize: '12px' }}>
                                                        {formatPercentage(product.gstAmount)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black" style={{ fontSize: '12px' }}>
                                                        {formatPercentage(product.sgstAmount)}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black font-bold" style={{ fontSize: '12px' }}>
                                                        {quantity}{unit}
                                                    </td>
                                                    <td className="text-center py-1 border-r border-black font-bold" style={{ fontSize: '12px' }}>
                                                        {formatCurrency(total)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {products.length < productsPerPage && Array.from({ length: productsPerPage - products.length }).map((_, index) => (
                                            <tr key={`empty-${index}`} className={`${products.length % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                                <td className="py-1 border-r border-black" style={{ fontSize: '12px' }}>&nbsp;</td>
                                            </tr>
                                        ))}

                                        <tr className='border-collapse' >
                                            <td colSpan={9} className='py-1 border border-black'>
                                                {pageIndex === productChunks.length - 1 ? (
                                                    <>
                                                        {/* Totals Section */}
                                                        <div className="p-1 mb-1">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-semibold text-[12px]">Subtotal:</span>
                                                                <span>{formatCurrency(totals.subtotal)}</span>
                                                            </div>
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-semibold text-[12px]">CGST:</span>
                                                                <span>{formatCurrency(totals.gstTotal)}</span>
                                                            </div>
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-semibold text-[12px]">SGST:</span>
                                                                <span>{formatCurrency(totals.sgstTotal)}</span>
                                                            </div>
                                                            <div className="flex justify-between mb-1 text-[12px]">
                                                                <span className="font-semibold">Delivery Charges:</span>
                                                                <span>{formatCurrency(totals.transport)}</span>
                                                            </div>
                                                            <div className="flex justify-between mb-1 text-[12px]">
                                                                <span className="font-semibold">Previous Credit:</span>
                                                                <span>{formatCurrency(totals.credit)}</span>
                                                            </div>

                                                            <div className="mt-1 mb-1 border-t border-black pt-1">
                                                                <span className="font-bold text-md">{billData.isOutstandingPaymentOnly ? 'Total Credit:' : 'Grand Total:'}</span>
                                                                <span className="font-bold float-right">{formatCurrency(totals.grandTotal)}</span>
                                                            </div>

                                                            {/* Payment Details Section */}
                                                            {billData.payment && (
                                                                <div className="border-t border-black pt-1">
                                                                    {!billData.isOutstandingPaymentOnly && (
                                                                        <div className="flex justify-between">
                                                                            <span className="font-semibold text-[12px]">Current Bill Payment:</span>
                                                                            <span>{formatCurrency(totals.currentPayment)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="font-semibold text-[12px]">Credit Payment:</span>
                                                                        <span>{formatCurrency(totals.outstandingPayment)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="font-semibold text-[12px]">Total Paid:</span>
                                                                        <span className="font-bold text-black-600">{formatCurrency(totals.totalPaid)}</span>
                                                                    </div>
                                                                    {totals.balanceDue > 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="font-semibold text-[12px]">Balance Due:</span>
                                                                            <span className="font-semibold text-red-600">{formatCurrency(totals.balanceDue)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className='flex justify-between mt-1'>
                                                                <div className="">
                                                                    <p className="text-[10px]">Amount In Words: {numberToWords(totals.grandTotal)}</p>
                                                                </div>
                                                                {billData.payment && (
                                                                    <div className="">
                                                                        <p><span className="font-semibold text-[10px]">Payment Method:</span> {billData.payment.method.toUpperCase()}</p>
                                                                        {billData.payment.transactionId && (
                                                                            <p><span className="font-semibold text-[10px]">Transaction ID:</span> {billData.payment.transactionId}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Footer Section */}
                                                            <div className="border-t border-black p-1 mt-auto flex justify-between">
                                                                <div className="mb-1 ">
                                                                    <h3 className="font-semibold mb-1">Company's Bank Details:</h3>
                                                                    <p className="text-xs">Bank Name: {displayValue(companyDetails.bankName, '')}</p>
                                                                    <p className="text-xs">Account No: {displayValue(companyDetails.accountNumber, '')}</p>
                                                                    <p className="text-xs">IFSC: {displayValue(companyDetails.ifscCode, '')}</p>
                                                                </div>
                                                                <div className="">
                                                                    <p className="font-semibold pt-14">Authorized Signatory</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-right text-red-500 font-semibold mt-20 mb-15">
                                                        (Continued...)
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PrintableBill;