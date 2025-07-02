import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/stock-summary');
        setStockData(res.data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };
    fetchStock();
  }, []);

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
  }, [product.quantity, product.mrp, product.gst, product.discount, product.price]); // Added product.price to dependencies for accuracy

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
    let val = type === 'number' ? parseFloat(value) || 0 : value;
    if (name === 'quantity' && val < 1) val = 1;
    setProduct((prev) => ({ ...prev, [name]: val }));
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const stock = stockData.find((s) => s.productName === product.name);

    if (stock && product.quantity > stock.remaining) {
      toast.error(`Only ${stock.remaining} units available for ${product.name}. Please reduce quantity.`, {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    if (editingIndex !== null) {
      onEdit(editingIndex, { ...product, id: products[editingIndex].id });
      setEditingIndex(null);
    } else {
      onAdd({ ...product, id: Date.now() });
    }

    setProduct(initialProduct);
  };

  const handleEdit = (index) => {
    const productToEdit = filteredProducts[index];
    const originalIndex = products.findIndex(p => p.id === productToEdit.id);
    if (originalIndex !== -1) {
      setProduct({ ...products[originalIndex] });
      setEditingIndex(originalIndex);
    }
  };

  const handleRemove = (filteredIndex) => {
    const productToRemove = filteredProducts[filteredIndex];
    const originalIndex = products.findIndex(p => p.id === productToRemove.id);
    if (originalIndex !== -1) {
      onRemove(originalIndex);
    }
  };

  const handleCancelEdit = () => {
    setProduct(initialProduct);
    setEditingIndex(null);
  };

  const filteredProducts = products.filter(
    (item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => filteredProducts.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="flex flex-col  h-full">
      {/* Header Section */}
      {/* Product Form Section */}
      <div className="bg-white p-3 mb-2 border border-gray-200 ">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between space-x-4 flex-wrap md:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-48"> {/* Adjust width here: w-40, w-48, w-60 */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search-product-input"
                placeholder="Search products..."
                className="pl-9 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Buttons and Search */}
            <div className="flex items-center space-x-2">
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
                className={`px-3 py-1 text-sm  rounded text-gray-800 ${editingIndex !== null
                  ? 'bg-gray-200 hover:bg-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                {editingIndex !== null ? 'Update' : 'Add'} Product
              </button>
            </div>

          </div>
          <div className="grid grid-cols-5 gap-2 mt-2"> {/* Adjusted grid-cols to 6 */}
            {[
              { label: 'S.No', name: 'sno', value: editingIndex !== null ? editingIndex + 1 : products.length + 1, readOnly: true, colSpan: 0.5 },
              { label: 'Code', name: 'code', value: product.code, colSpan: 1 },
              { label: 'Name', name: 'name', value: product.name, colSpan: 2 },
              { label: 'Qty', name: 'quantity', value: product.quantity, type: 'number', min: 1, colSpan: 0.5 },
              { label: 'MRP', name: 'mrp', value: product.mrp, type: 'number', min: 0, step: 0.01, colSpan: 1 },

            ].map(({ label, name, value, colSpan, ...rest }) => (
              <div key={name} className={`col-span-${Math.round(colSpan * 2)}`}>
                <label className="block font-medium text-sm text-gray-800 mb-1">
                  {label}
                </label>
                <input
                  type={rest.type || 'text'}
                  name={name}
                  value={value}
                  onChange={handleChange}
                  {...rest}
                  className={`w-full px-2 py-1 text-sm border ${rest.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    } border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  required={!rest.readOnly}
                />
              </div>
            ))}
            {/* Hidden inputs for GST and Discount to still capture values */}
            <input type="hidden" name="gst" value={product.gst} />
            <input type="hidden" name="discount" value={product.discount} />
            <input type="hidden" name="price" value={product.price} />
          </div>

        </form>
      </div>

      {/* Excel-like Product Table Container */}
      <div className="flex-1 overflow-hidden bg-white shadow border border-gray-200 flex flex-col">
        {/* Table with fixed header and scrollable body */}
        <div className="relative flex-1">
         <div className="h-[380px] overflow-y-auto scrollbar-hide">
            <table className="min-w-full table-fixed border-collapse text-sm text-gray-800 border border-gray-300">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {/* Adjusted widths for table headers - 7 columns now */}
                  <th className="w-[5%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">S.No</th>
                  <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">Code</th>
                  <th className="w-[35%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">Name</th>
                  <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">MRP</th>
                  <th className="w-[10%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">Qty</th>
                  <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-center uppercase tracking-wide">Total</th>
                  <th className="w-[10%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-200 text-right uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 font-semibold">
                {filteredProducts.length > 0 ? (
                  <>
                    {filteredProducts.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                          } hover:bg-blue-100 transition duration-150 border-b border-gray-300`}
                      >
                        <td className="w-[5%] px-2 py-2 border border-gray-300 text-center">
                          {index + 1}
                        </td>
                        <td className="w-[15%] px-2 py-2 border border-gray-300 text-center">
                          {item.code}
                        </td>
                        <td className="w-[35%] px-2 py-2 border border-gray-300 text-start overflow-hidden">
                          {item.name}
                        </td>
                        <td className="w-[15%] px-2 py-2 border border-gray-300 text-end">
                          {item.mrp.toFixed(2)}
                        </td>
                        <td className="w-[10%] px-2 py-2 border border-gray-300 text-center">
                          {item.quantity}
                        </td>
                        <td className="w-[15%] px-2 py-2 border border-gray-300 text-end">
                          {(item.price).toFixed(2)}
                        </td>
                        <td className="w-[10%] px-2 py-2 border border-gray-300 text-center">
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
                              onClick={() => handleRemove(index)}
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
                    ))}
                    {/* Add empty rows if needed */}
                    {filteredProducts.length < 15 && ( // Adjusted to 5 for empty rows (total 7 columns displayed in header)
                      Array.from({ length: 15 - filteredProducts.length }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10 border-b border-gray-300">
                          {/* 7 empty cells for 7 columns */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* S.No */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* Code */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* Name */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* Qty */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* MRP */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* Total */}
                          <td className="px-3 py-2 border border-gray-300"></td> {/* Action */}
                        </tr>
                      ))
                    )}
                  </>
                ) : (
                  <tr>
                    {/* Updated to display the message in the "Name" column and ensure all borders */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* S.No */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* Code */}
                    <td className="px-4 py-1 text-center text-sm text-gray-500 border border-gray-300">
                      {searchTerm ? 'No products match your search' : 'No products added yet'}
                    </td> {/* Name */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* Qty */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* MRP */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* Total */}
                    <td className="px-4 py-1 border border-gray-300"></td> {/* Action */}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-300 sticky bottom-0">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Showing {filteredProducts.length} of {products.length} items
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-blue-800">
                  <span className="font-medium text-black">Total: </span> ₹ {calculateTotal().toFixed(2)}
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