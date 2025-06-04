import { useState } from 'react'

function PaymentModal({ total, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  })
  const [onlineDetails, setOnlineDetails] = useState({
    transactionId: ''
  })
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    
    let details
    switch (paymentMethod) {
      case 'cash':
        details = {
          method: 'cash',
          amountReceived: parseFloat(cashReceived),
          change: parseFloat(cashReceived) - total
        }
        break
      case 'card':
        details = {
          method: 'card',
          cardLast4: cardDetails.number.slice(-4),
          amount: total
        }
        break
      case 'online':
        details = {
          method: 'online',
          transactionId: onlineDetails.transactionId,
          amount: total
        }
        break
      default:
        return
    }

    setPaymentDetails(details)
    setPaymentSuccess(true)
    onComplete(details)
  }

  const handleSaveAndPrint = async () => {
    setIsSaving(true)
    try {
      // Print the bill first
      printBill()
      
      // Close the modal
      onClose()
    } catch (error) {
      console.error('Error saving data:', error)
      alert('Failed to save data. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const printBill = () => {
    const now = new Date()
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">Invoice</h2>
        <div style="margin-bottom: 15px;">
          <p><strong>Date:</strong> ${now.toLocaleString()}</p>
          ${paymentDetails.method === 'cash' ? `
            <p><strong>Payment Method:</strong> Cash</p>
            <p><strong>Amount Received:</strong> ₹${paymentDetails.amountReceived.toFixed(2)}</p>
            <p><strong>Change:</strong> ₹${paymentDetails.change.toFixed(2)}</p>
          ` : ''}
          ${paymentDetails.method === 'card' ? `
            <p><strong>Payment Method:</strong> Card</p>
            <p><strong>Card Last 4 Digits:</strong> ${paymentDetails.cardLast4}</p>
          ` : ''}
          ${paymentDetails.method === 'online' ? `
            <p><strong>Payment Method:</strong> Online</p>
            <p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
          ` : ''}
        </div>
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px;">
          <p style="text-align: right; font-size: 18px; font-weight: bold;">
            Total: ₹${total.toFixed(2)}
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-style: italic;">
          Thank you for your purchase!
        </div>
      </div>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            @media print {
              body { visibility: hidden; }
              .print-content { visibility: visible; position: absolute; left: 0; top: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">${printContent}</div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 200);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Payment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {!paymentSuccess ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 rounded-md border ${paymentMethod === 'cash' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2 rounded-md border ${paymentMethod === 'card' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`py-2 rounded-md border ${paymentMethod === 'online' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                    >
                      Online
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                    <input
                      type="number"
                      min={total}
                      step="0.01"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {cashReceived && parseFloat(cashReceived) > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Change: </span>
                        <span className="font-bold">
                          ₹{(parseFloat(cashReceived) - total).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      placeholder="Enter transaction ID"
                      value={onlineDetails.transactionId}
                      onChange={(e) => setOnlineDetails({...onlineDetails, transactionId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Complete Payment
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Total amount ₹${total.toFixed(2)} has been received via {paymentDetails.method}.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleSaveAndPrint}
                  disabled={isSaving}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSaving ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Printing...' : 'Save & Print'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal