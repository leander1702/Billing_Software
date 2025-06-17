// Updated ProductList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductList({ products, onAdd, onEdit, onRemove, onBillComplete }) {
  const initialProduct = {
    code: '',
    name: '',
    quantity: 1,
    mrp: 0.0,
    gst: 0.0,
    discount: 0.0,
    price: 0.0,
  };

  const [product, setProduct] = useState(initialProduct);
  const [editingIndex, setEditingIndex] = useState(null);
  const [billNumber, setBillNumber] = useState(1);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { quantity, mrp, gst, discount } = product;
    if (quantity > 0 && mrp >= 0 && gst >= 0 && discount >= 0) {
      const basePrice = mrp * quantity;
      const gstAmount = basePrice * (gst / 100);
      const discountAmount = (basePrice + gstAmount) * (discount / 100);
      const calculatedPrice = basePrice + gstAmount - discountAmount;

      if (calculatedPrice !== product.price) {
        setProduct((prev) => ({ ...prev, price: parseFloat(calculatedPrice.toFixed(2)) }));
      }
    }
  }, [product.quantity, product.mrp, product.gst, product.discount]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (product.code.trim() !== '') {
        try {
          const res = await axios.get(`http://localhost:5000/api/products`);
          const match = res.data.find((p) => p.productCode === product.code);
          if (match) {
            setProduct((prev) => ({
              ...prev,
              name: match.productName,
              mrp: match.mrp,
              gst: match.gst,
              discount: match.discount,
            }));
          }
        } catch (err) {
          console.error('Error fetching product details', err);
        }
      }
    };
    fetchProductDetails();
  }, [product.code]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let val = type === 'number' ? Number(value) : value;
    if (name === 'quantity' && val < 1) val = 1;
    setProduct((prev) => ({ ...prev, [name]: val }));
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingIndex !== null) {
      onEdit(editingIndex, { ...product, id: products[editingIndex].id });
      setEditingIndex(null);
    } else {
      onAdd({ ...product, id: Date.now() });
      // Update stock quantity in DB
      try {
        const res = await axios.get(`http://localhost:5000/api/products`);
        const match = res.data.find((p) => p.productCode === product.code);
        if (match) {
          const updatedQty = match.stockQuantity - product.quantity;
          await axios.put(`http://localhost:5000/api/products/${match._id}`, {
            stockQuantity: updatedQty,
          });
        }
      } catch (err) {
        console.error('Error updating stock quantity', err);
      }
    }
    setProduct(initialProduct);
  };

  const handleEdit = (index) => {
    const item = products[index];
    setProduct({ ...item });
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setProduct(initialProduct);
    setEditingIndex(null);
  };

  const filteredProducts = products.filter(
    (item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()) || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => filteredProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="flex flex-col p-4 bg-gray-50">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Invoice #{billNumber}</h2>
          <p className="text-xs text-gray-500">Created at {formatDate(currentDateTime)} {formatTime(currentDateTime)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={onBillComplete}
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Complete Bill
          </button>
        </div>
      </div>

      {/* Product Form Section */}
      <div className="bg-white p-3 rounded-md shadow-sm mb-3 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {editingIndex !== null ? 'Edit Product' : 'Add New Product'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-8 gap-2">
            {[
              { label: 'S.No', name: 'sno', value: editingIndex !== null ? editingIndex + 1 : products.length + 1, readOnly: true },
              { label: 'Code', name: 'code', value: product.code },
              { label: 'Name', name: 'name', value: product.name, colSpan: 2 },
              { label: 'Qty', name: 'quantity', value: product.quantity, type: 'number', min: 1 },
              { label: 'MRP', name: 'mrp', value: product.mrp, type: 'number', min: 0, step: 0.01 },
              { label: 'GST%', name: 'gst', value: product.gst, type: 'number', min: 0, step: 0.01 },
              { label: 'Disc%', name: 'discount', value: product.discount, type: 'number', min: 0, step: 0.01 },
              { label: 'Price', name: 'price', value: product.price, type: 'number', min: 0, step: 0.01, readOnly: true },
            ].map(({ label, name, value, ...rest }) => (
              <div key={name} className={`col-span-${rest.colSpan || 1}`}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  type={rest.type || 'text'}
                  name={name}
                  value={value}
                  onChange={handleChange}
                  {...rest}
                  className={`w-full px-2 py-1 text-sm border ${rest.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  required={!rest.readOnly}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end space-x-2">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`px-3 py-1 text-sm rounded text-white ${editingIndex !== null ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {editingIndex !== null ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>

      {/* Excel-like Product Table Container */}
      <div className="flex-1 overflow-hidden bg-white rounded-md shadow-sm border border-gray-200 flex flex-col">
        {/* Table with fixed header and scrollable body */}
        <div className="relative">
          <div className={`${filteredProducts.length > 5 ? 'max-h-60 overflow-y-scroll' : ''}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {["S.No", "Code", "Name", "Qty", "MRP", "GST%", "Disc%", "Price", "Total", "Action"].map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200 font-mono">
                        {item.code}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right border-b border-gray-200">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right border-b border-gray-200">
                        {item.mrp.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right border-b border-gray-200">
                        {item.gst}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right border-b border-gray-200">
                        {item.discount}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right border-b border-gray-200 font-medium">
                        {item.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200 font-bold">
                        ₹{(item.price).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right border-b border-gray-200">
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onRemove(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No products match your search' : 'No products added yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 sticky bottom-0 z-10">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Showing {filteredProducts.length} of {products.length} items
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Subtotal:</span> ₹{calculateTotal().toFixed(2)}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  <span className="font-medium">Total:</span> ₹{calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
