function BillSummary({
  customer,
  products,
  subtotal,
  gst,
  total,
  onNewCustomer,
  onProceedToPayment,
  onBack,
  onProceed
}) {
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm sticky top-4">
      <h2 className="text-sm font-semibold mb-2">Bill Summary</h2>

      <div className="space-y-2">     

        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              ₹{products.length
                ? products.reduce((sum, item) => {
                    const base = item.mrp * item.quantity;
                    const discount = base * (item.discount / 100);
                    return sum + (base - discount);
                  }, 0).toFixed(2)
                : '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">GST:</span>
            <span className="font-medium">
              ₹{products.length
                ? products.reduce((sum, item) => {
                    const base = item.mrp * item.quantity;
                    const discount = base * (item.discount / 100);
                    const discounted = base - discount;
                    return sum + (discounted * item.gst) / 100;
                  }, 0).toFixed(2)
                : '0.00'}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-sm">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-base">
              ₹{products.length
                ? products.reduce((sum, item) => {
                    const base = item.mrp * item.quantity;
                    const discount = base * (item.discount / 100);
                    const discounted = base - discount;
                    const gst = (discounted * item.gst) / 100;
                    return sum + discounted + gst;
                  }, 0).toFixed(2)
                : '0.00'}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {onProceedToPayment ? (
            <>
              <button
                onClick={onProceedToPayment}
                disabled={!products.length || !customer?.id}
                className={`w-full py-1 text-sm rounded-sm focus:outline-none ${
                  !products.length || !customer?.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Proceed to Payment
              </button>
              <button
                onClick={onNewCustomer}
                className="w-full bg-gray-500 text-white py-1 text-sm rounded-sm hover:bg-gray-600 focus:outline-none"
              >
                New Customer
              </button>
            </>
          ) : (
            <>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full bg-gray-500 text-white py-1 text-sm rounded-sm hover:bg-gray-600 focus:outline-none"
                >
                  Back
                </button>
              )}
              {onProceed && (
                <button
                  onClick={onProceed}
                  disabled={!products.length}
                  className={`w-full py-1 text-sm rounded-sm focus:outline-none ${
                    !products.length
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next: Customer Details
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BillSummary;
