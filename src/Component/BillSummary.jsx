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
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 sticky top-4">
      <h2 className="text-base font-semibold mb-3">Bill Summary</h2>
      
      <div className="space-y-3">
        {customer?.id && (
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 truncate"><span className="font-medium">ID:</span> {customer.id}</p>
            <p className="text-gray-700 truncate"><span className="font-medium">Name:</span> {customer.name}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₹{products.length ? subtotal.toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">GST:</span>
            <span className="font-medium">₹{products.length ? gst.toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 text-sm">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-base">₹{products.length ? total.toFixed(2) : '0.00'}</span>
          </div>
        </div>

        <div className="space-y-2 pt-3">
          {onProceedToPayment ? (
            <>
              <button
                onClick={onProceedToPayment}
                disabled={!products.length || !customer?.id}
                className={`w-full py-1.5 text-sm rounded focus:outline-none ${
                  !products.length || !customer?.id 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Proceed to Payment
              </button>
              <button
                onClick={onNewCustomer}
                className="w-full bg-gray-500 text-white py-1.5 text-sm rounded hover:bg-gray-600 focus:outline-none"
              >
                New Customer
              </button>
            </>
          ) : (
            <>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full bg-gray-500 text-white py-1.5 text-sm rounded hover:bg-gray-600 focus:outline-none"
                >
                  Back
                </button>
              )}
              {onProceed && (
                <button
                  onClick={onProceed}
                  disabled={!products.length}
                  className={`w-full py-1.5 text-sm rounded focus:outline-none ${
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
  )
}

export default BillSummary