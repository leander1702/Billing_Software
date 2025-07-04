import { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
import axios from 'axios';
import { toast } from 'react-toastify';

function ProductList({ products, onAdd, onEdit, onRemove, onBillComplete, onFocusProductSearch, onFocusProductCode, onFocusQuantity, onTriggerAddProduct }) {
  const initialProduct = {
    code: '',
    name: '',
    quantity: '',
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

  // Create refs for the input fields and button
  const searchProductInputRef = useRef(null);
  const productCodeInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const addProductButtonRef = useRef(null);

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
  }, [product.quantity, product.mrp, product.gst, product.discount, product.price]);

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
              quantity: '',
            }));
            setTimeout(() => {
              quantityInputRef.current?.focus();
            }, 100);
          }
        } catch (err) {
          console.error('Error fetching product details', err);
        }
      }
    };
    fetchProductDetails();
  }, [product.code]);

  useEffect(() => {
    const { code, quantity } = product;

    if (!code || !quantity || quantity <= 0) return;

    const matchedStock = stockData.find(
      (s) => s.productCode === code || s.productName === product.name
    );

    if (matchedStock && quantity > matchedStock.remaining) {
      toast.error(`❌ Only ${matchedStock.remaining} units available for "${matchedStock.productName}"`, {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  }, [product.code, product.quantity, product.name, stockData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;

    if (name === 'quantity' && val < 1) val = '';
    setProduct((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const stock = stockData.find((s) => s.productName === product.name);
    if (stock) {
      const existing = products.find(p => p.code === product.code);
      const totalRequestedQty = existing ? existing.quantity + product.quantity : product.quantity;
      if (totalRequestedQty > stock.remaining) {
        toast.error(`Only ${stock.remaining} units available for ${product.name}.`, {
          position: "top-right",
          autoClose: 3000,
          closeOnClick: true,
          pauseOnHover: true,
        });
        return;
      }
    }

    if (editingIndex !== null) {
      onEdit(editingIndex, { ...product, id: products[editingIndex].id });
      setEditingIndex(null);
    } else {
      const existingIndex = products.findIndex(p => p.code === product.code);
      if (existingIndex !== -1) {
        const existingProduct = products[existingIndex];
        const newQty = parseFloat(existingProduct.quantity) + parseFloat(product.quantity);
        const basePrice = product.mrp * newQty;
        const gstAmount = basePrice * (product.gst / 100);
        const discountAmount = (basePrice + gstAmount) * (product.discount / 100);
        const newPrice = basePrice + gstAmount - discountAmount;

        const updatedProduct = {
          ...existingProduct,
          quantity: newQty,
          price: parseFloat(newPrice.toFixed(2)),
        };
        onEdit(existingIndex, updatedProduct);
      } else {
        onAdd({ ...product, id: Date.now() });
      }
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

  // --- Shortcut Action Implementations ---
  const focusProductSearch = useCallback(() => {
    searchProductInputRef.current?.focus();
  }, []);

  const focusProductCode = useCallback(() => {
    productCodeInputRef.current?.focus();
  }, []);

  const focusQuantity = useCallback(() => {
    quantityInputRef.current?.focus();
  }, []);

  const triggerAddProduct = useCallback(() => {
    addProductButtonRef.current?.click(); // Simulate a click on the add button
  }, []);

  // Expose these functions via the props received from Navbar
  useEffect(() => {
    if (onFocusProductSearch) onFocusProductSearch.current = focusProductSearch;
    if (onFocusProductCode) onFocusProductCode.current = focusProductCode;
    if (onFocusQuantity) onFocusQuantity.current = focusQuantity;
    if (onTriggerAddProduct) onTriggerAddProduct.current = triggerAddProduct;
  }, [onFocusProductSearch, onFocusProductCode, onFocusQuantity, onTriggerAddProduct, focusProductSearch, focusProductCode, focusQuantity, triggerAddProduct]);


// ProductList.jsx (Relevant section for the table)
return (
  <div className="flex flex-col h-full">
    <div className="bg-white p-3 mb-2 border border-gray-200 ">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between space-x-4 flex-wrap md:flex-nowrap">
          {/* Search Input */}
          <div className="relative w-48">
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
              ref={searchProductInputRef} // Attach ref here
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
              className={`px-3 py-1 text-sm rounded text-gray-800 ${editingIndex !== null
                  ? 'bg-gray-200 hover:bg-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300'
                }`}
              ref={addProductButtonRef} // Attach ref here
            >
              {editingIndex !== null ? 'Update' : 'Add'} Product
            </button>
          </div>

        </div>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {[
            { label: 'S.No', name: 'sno', value: editingIndex !== null ? editingIndex + 1 : products.length + 1, readOnly: true, colSpan: 0.5 },
            { label: 'Code', name: 'code', value: product.code, colSpan: 1, inputRef: productCodeInputRef }, // Attach ref here
            { label: 'Name', name: 'name', value: product.name, colSpan: 2, readOnly: true },
            {
              label: 'Qty',
              name: 'quantity',
              value: product.quantity,
              type: 'number',
              min: 1,
              colSpan: 0.5,
              inputRef: quantityInputRef,
              required: true
            },
            { label: 'MRP', name: 'mrp', value: product.mrp, type: 'number', readOnly: true, colSpan: 1 },
          ].map(({ label, name, value, colSpan, inputRef, ...rest }) => (
            <div key={name} className={`col-span-${Math.round(colSpan * 2)}`}>
              <label className="block font-medium text-sm text-gray-800 mb-1">
                {label}
              </label>
              <input
                type={rest.type || 'text'}
                name={name}
                value={value}
                onChange={handleChange}
                ref={inputRef}
                {...rest}
                className={`w-full px-2 py-1 text-sm border ${rest.readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                required={!rest.readOnly}
              />
            </div>
          ))
          }
          {/* Hidden inputs for GST and Discount to still capture values */}
          <input type="hidden" name="gst" value={product.gst} />
          <input type="hidden" name="discount" value={product.discount} />
          <input type="hidden" name="price" value={product.price} />
        </div>

      </form>
    </div>

    {/* Excel-like Product Table Container */}
    <div className="flex-1 bg-white shadow border border-gray-200 flex flex-col">
      {/* Table with fixed header and scrollable body */}
      {/* The height of this div now needs to be fixed to prevent expansion */}
      {/* Using calc(100vh - Xpx) makes it responsive to viewport height */}
      <div className="relative" style={{ height: 'calc(100vh - 290px)' }}> {/* Adjust 350px based on your layout */}
        <div className="overflow-y-auto scrollbar-hide h-full"> {/* h-full here makes it fill its parent's height */}
          <table className="min-w-full table-fixed border-collapse text-sm text-gray-800 border border-gray-300">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-[5%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">S.No</th>
                <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">Code</th>
                <th className="w-[35%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">Name</th>
                <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">MRP</th>
                <th className="w-[10%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">Qty</th>
                <th className="w-[15%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-center uppercase tracking-wide">Total</th>
                <th className="w-[10%] px-2 py-2 text-xs font-bold text-gray-700 border border-gray-300 bg-blue-300 text-right uppercase tracking-wide">Action</th>
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
                  {/* Changed to 10 rows for example, adjust as needed */}
                  {filteredProducts.length < 10 && (
                    Array.from({ length: 10 - filteredProducts.length }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-10 border-b border-gray-300">
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300"></td>
                      </tr>
                    ))
                  )}
                </>
              ) : (
                <tr>
                  <td className="px-4 py-1 border border-gray-300"></td>
                  <td className="px-4 py-1 border border-gray-300"></td>
                  <td className="px-4 py-1 text-center text-sm text-gray-500 border border-gray-300">
                    {searchTerm ? 'No products match your search' : 'No products added yet'}
                  </td>
                  <td className="px-4 py-1 border border-gray-300"></td>
                  <td className="px-4 py-1 border border-gray-300"></td>
                  <td className="px-4 py-1 border border-gray-300"></td>
                  <td className="px-4 py-1 border border-gray-300"></td>
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