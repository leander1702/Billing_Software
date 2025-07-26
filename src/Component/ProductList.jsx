import { useState, useEffect, useRef } from 'react';
import '../App.css';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';
import Api from '../services/api';
import Swal from 'sweetalert2';

function ProductList({ products, onAdd, onEdit, onRemove }) {
  const initialProduct = {
    code: '',
    name: '',
    quantity: '',
    mrpPrice: 0,
    gst: 0.0,
    sgst: 0.0,
    mrp: 0,
    discount: 0.0,
    price: 0,
    baseUnit: 'piece',
    selectedUnit: '',
    conversionRate: 1,
    basePrice: 0,
    secondaryPrice: 0,
    isManualPrice: false,
    totalPrice: 0,
    gstAmount: 0,
    sgstAmount: 0,
    basicPrice: 0
  };

  const [product, setProduct] = useState(initialProduct);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockData, setStockData] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const unitTypes = [
    { value: 'piece', label: 'Pcs' },
    { value: 'box', label: 'Box' },
    { value: 'kg', label: 'kg' },
    { value: 'gram', label: 'g' },
    { value: 'liter', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'bag', label: 'bag' },
    { value: 'packet', label: 'packet' },
    { value: 'bottle', label: 'bottle' },
  ];

  // Refs for input fields
  const searchProductInputRef = useRef(null);
  const productCodeInputRef = useRef(null);
  const productNameInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const addProductButtonRef = useRef(null);
  const priceInputRef = useRef(null);

  // Fetch stock data
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await Api.get('/stock-summary');
        setStockData(res.data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };
    fetchStock();
  }, []);

  // Fetch product suggestions by name
  const fetchProductSuggestions = async (name) => {
    if (name.length < 2) {
      setNameSuggestions([]);
      return;
    }

    try {
      const res = await Api.get(`/products/search?query=${name}`);
      setNameSuggestions(res.data || []);
      setShowNameSuggestions(true);
    } catch (err) {
      console.error('Error fetching product suggestions:', err);
      setNameSuggestions([]);
    }
  };

  const fetchProductDetails = async (identifier, isCode = true) => {
    if (!identifier.trim()) return;
    setIsLoading(true);

    try {
      const endpoint = isCode ? `/products/code/${identifier}` : `/products/name/${identifier}`;
      const res = await Api.get(endpoint);
      const productData = res.data;

      if (productData) {
        const units = [productData.baseUnit];
        if (productData.secondaryUnit) units.push(productData.secondaryUnit);

        setAvailableUnits(units);

        const selectedUnit = product.selectedUnit || productData.baseUnit;
        let price = productData.mrp || 0;

        if (selectedUnit === productData.secondaryUnit) {
          price = productData.mrp / productData.conversionRate;
          price = Math.round(price * 10) / 10;
        }

        const gstPercentage = productData.gst || 0;
        const sgstPercentage = productData.sgst || 0;
        const totalTaxPercentage = gstPercentage + sgstPercentage;

        const basicPrice = totalTaxPercentage > 0
          ? price / (1 + (totalTaxPercentage / 100))
          : price;

        const gstAmount = basicPrice * (gstPercentage / 100);
        const sgstAmount = basicPrice * (sgstPercentage / 100);

        setProduct(prev => ({
          ...prev,
          code: productData.productCode || '',
          name: productData.productName || '',
          baseUnit: productData.baseUnit,
          selectedUnit: selectedUnit,
          basePrice: productData.basePrice || productData.mrpPrice || 0,
          secondaryPrice: productData.secondaryPrice || 0,
          conversionRate: productData.conversionRate || 1,
          mrpPrice: productData.mrpPrice || 0,
          gst: gstPercentage,
          sgst: sgstPercentage,
          discount: productData.discount || 0,
          price: price,
          basicPrice: basicPrice,
          gstAmount: gstAmount,
          sgstAmount: sgstAmount,
          quantity: '',
          totalPrice: 0,
          isManualPrice: false
        }));

        quantityInputRef.current?.focus();
      }
    } catch (err) {
      console.error('Error fetching product details', err);
      toast.error("Product not found");
      setProduct(prev => ({
        ...prev,
        name: '',
        mrpPrice: 0,
        gst: 0,
        sgst: 0,
        discount: 0,
        price: 0,
        basicPrice: 0,
        quantity: '',
        totalPrice: 0,
        gstAmount: 0,
        sgstAmount: 0,
        isManualPrice: false
      }));
      setAvailableUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch product details when code changes
  useEffect(() => {
    if (product.code && !editingIndex) {
      const timer = setTimeout(() => {
        fetchProductDetails(product.code, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [product.code, editingIndex]);

  // Handle name changes and fetch suggestions
  const handleNameChange = (e) => {
    const { value } = e.target;
    setProduct(prev => ({ ...prev, name: value }));

    if (value.length > 1) {
      fetchProductSuggestions(value);
    } else {
      setNameSuggestions([]);
    }
  };

  // Handle unit change
  useEffect(() => {
    if (product.code && (product.selectedUnit || product.baseUnit)) {
      fetchProductDetails(product.code, true);
    }
  }, [product.selectedUnit]);

  // Calculate total when quantity or price changes
  useEffect(() => {
    if (product.quantity && product.price) {
      const quantity = parseFloat(product.quantity) || 0;
      const price = parseFloat(product.price) || 0;
      const totalPrice = quantity * price;

      setProduct(prev => ({
        ...prev,
        totalPrice: totalPrice
      }));
    }
  }, [product.quantity, product.price]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['quantity', 'price', 'gst', 'sgst', 'basicPrice', 'mrpPrice'];

    let processedValue = value;
    if (numericFields.includes(name)) {
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        processedValue = value.replace(/^0+/, '') || '0';
      }
    }

    if (name === 'quantity') {
      const quantity = parseFloat(processedValue) || 0;
      const price = parseFloat(product.price) || 0;
      const totalPrice = quantity * price;

      setProduct(prev => ({
        ...prev,
        [name]: processedValue,
        totalPrice: totalPrice
      }));
    } else if (name === 'price') {
      const priceValue = parseFloat(processedValue) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      const totalPrice = quantity * priceValue;

      const gstPercentage = product.gst || 0;
      const sgstPercentage = product.sgst || 0;
      const totalTaxPercentage = gstPercentage + sgstPercentage;

      const basicPrice = totalTaxPercentage > 0
        ? priceValue / (1 + (totalTaxPercentage / 100))
        : priceValue;

      const gstAmount = basicPrice * (gstPercentage / 100);
      const sgstAmount = basicPrice * (sgstPercentage / 100);

      setProduct(prev => ({
        ...prev,
        price: priceValue,
        basicPrice: basicPrice,
        gstAmount: gstAmount,
        sgstAmount: sgstAmount,
        totalPrice: totalPrice,
        isManualPrice: true
      }));
    } else if (name === 'gst' || name === 'sgst') {
      const gstValue = name === 'gst' ? parseFloat(processedValue) || 0 : product.gst;
      const sgstValue = name === 'sgst' ? parseFloat(processedValue) || 0 : product.sgst;
      const priceValue = parseFloat(product.price) || 0;
      const totalTaxPercentage = gstValue + sgstValue;

      const basicPrice = totalTaxPercentage > 0
        ? priceValue / (1 + (totalTaxPercentage / 100))
        : priceValue;

      const gstAmount = basicPrice * (gstValue / 100);
      const sgstAmount = basicPrice * (sgstValue / 100);

      setProduct(prev => ({
        ...prev,
        [name]: name === 'gst' ? gstValue : sgstValue,
        basicPrice: basicPrice,
        gstAmount: gstAmount,
        sgstAmount: sgstAmount
      }));
    } else {
      setProduct(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleUnitChange = (e) => {
    const selectedUnit = e.target.value || product.baseUnit;
    setProduct(prev => ({
      ...prev,
      selectedUnit,
      isManualPrice: false
    }));
  };

// Add this function to check stock before adding product
const checkStockAvailability = async (productName, quantity, unit) => {
  try {
    const product = await Api.get(`/products/name/${productName}`);
    if (!product.data) return { isAvailable: false, available: 0 };

    const response = await Api.get(`/products/check-stock/${product.data.productCode}`, {
      params: { unit, quantity }
    });

    return response.data;
  } catch (err) {
    console.error('Error checking stock:', err);
    return { isAvailable: false, available: 0 };
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!product.code || !product.quantity) {
    toast.error("Product code and quantity are required!");
    return;
  }

  const quantityValue = parseFloat(product.quantity);
  if (isNaN(quantityValue) || quantityValue <= 0) {
    toast.error("Please enter a valid quantity!");
    return;
  }

  // Check stock availability
  const stockCheck = await checkStockAvailability(
    product.name,
    quantityValue,
    product.selectedUnit || product.baseUnit
  );

  if (!stockCheck.isAvailable) {
    // Show SweetAlert popup with stock information
    await Swal.fire({
      title: 'Insufficient Stock',
      html: `Only <b>${stockCheck.availableDisplay.toFixed(2)} ${product.selectedUnit || product.baseUnit}</b> available for <b>${product.name}</b>`,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
    });
    return;
  }

  const newProduct = {
    ...product,
    id: Date.now(),
    quantity: quantityValue,
    price: parseFloat(product.price),
    basicPrice: product.basicPrice,
    gstAmount: product.gstAmount,
    sgstAmount: product.sgstAmount,
    totalPrice: product.totalPrice,
    unit: product.selectedUnit || product.baseUnit,
    isManualPrice: product.isManualPrice,
    availableStock: stockCheck.available
  };

  if (editingIndex !== null) {
    onEdit(editingIndex, newProduct);
    setEditingIndex(null);
  } else {
    onAdd(newProduct);
  }

  setProduct(initialProduct);
  setNameSuggestions([]);
  searchProductInputRef.current?.focus();
};

  const handleEdit = (index) => {
    const productToEdit = products[index];
    setProduct({
      ...productToEdit,
      quantity: productToEdit.quantity.toString(),
      selectedUnit: productToEdit.unit
    });
    setEditingIndex(index);
    productCodeInputRef.current?.focus();
  };

  const handleRemove = (index) => {
    onRemove(index);
  };

  const handleSelectNameSuggestion = (suggestion) => {
    fetchProductDetails(suggestion.productName, false);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  const filteredProducts = products.filter(
    (item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => filteredProducts.reduce((sum, item) => sum + item.totalPrice, 0);

  const getUnitLabel = (unitValue) => {
    const unit = unitTypes.find(u => u.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Product Form */}
      <div className="bg-white p-4 border border-gray-200 ">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by code..."
                className="w-3/4 pl-10 pr-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchProductInputRef}
              />
            </div>
            <button
              type="submit"
              className={`px-4 py-1 text-sm rounded-sm flex items-center gap-2 ${editingIndex !== null
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              ref={addProductButtonRef}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Loading...
                </>
              ) : editingIndex !== null ? (
                <>
                  <FiEdit2 />
                  Update
                </>
              ) : (
                <>
                  <FiPlus />
                  Add Product
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2">
            {/* Product Code */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Code*</label>
              <input
                type="text"
                name="code"
                value={product.code}
                onChange={handleChange}
                ref={productCodeInputRef}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Product Name with Suggestions */}
            <div className="col-span-1 relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleNameChange}
                onFocus={() => setShowNameSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                ref={productNameInputRef}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {nameSuggestions.map((item, index) => (
                    <div
                      key={index}
                      className="px-4 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleSelectNameSuggestion(item)}
                    >
                      <div className="font-medium">{item.productName}</div>
                      {/* <div className="text-sm text-gray-600">{item.productCode}</div> */}
                      {/* <div className="text-sm text-gray-500">₹{item.mrpPrice?.toFixed(2)}</div> */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unit Selection */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select
                name="selectedUnit"
                value={product.selectedUnit || product.baseUnit}
                onChange={handleUnitChange}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {availableUnits.map(unit => (
                  <option key={unit} value={unit}>
                    {getUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Qty*</label>
              <input
                type="text"
                name="quantity"
                value={product.quantity}
                onChange={handleChange}
                ref={quantityInputRef}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Basic Price (excluding taxes) */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Basic Price</label>
              <input
                type="text"
                name="basicPrice"
                value={product.basicPrice.toFixed(2)}
                readOnly
                className="w-full px-3 py-1 text-sm border bg-gray-100 rounded-sm"
              />
            </div>

            {/* GST */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
              <input
                type="text"
                name="gst"
                value={product.gst}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* SGST */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">SGST %</label>
              <input
                type="text"
                name="sgst"
                value={product.sgst}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price (including taxes) */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Price*</label>
              <input
                type="text"
                name="price"
                value={product.price}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                ref={priceInputRef}
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Total Price */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
              <input
                type="text"
                name="totalPrice"
                value={product.totalPrice.toFixed(2)}
                readOnly
                className="w-full px-3 py-1 text-sm border bg-gray-100 rounded-sm font-medium text-blue-600"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="flex-1 relative overflow-hidden bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="overflow-x-auto h-full"
          style={{
            maxHeight: 'calc(100vh - 350px)', // Adjust this value as needed
            marginBottom: '80px' // Add space for the fixed footer
          }}
        >
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">S.NO</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">CODE</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">NAME</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">MRP</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">BASIC PRICE</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">GST % /<span className='flex'>GST Amt</span></th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">SGST % /<span className='flex'>SGST Amt</span></th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">PRICE</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">QTY/UNIT</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">TOTAL</th>
                <th className="px-4 py-2 text-left border-b font-medium text-gray-700">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((item, index) => {
                  const basicPriceTotal = item.basicPrice;
                  const gstAmountTotal = item.gstAmount;
                  const sgstAmountTotal = item.sgstAmount;
                  const priceTotal = item.price;
                  const totalPrice = item.price * item.quantity;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-1">{index + 1}</td>
                      <td className="px-4 py-1 font-medium">{item.code}</td>
                      <td className="px-4 py-1">{item.name}</td>
                      <td className="px-4 py-1">₹{item.mrpPrice.toFixed(2)}</td>
                      <td className="px-4 py-1">₹{basicPriceTotal.toFixed(2)}</td>
                      <td className="px-4 py-1">{item.gst}% <span className='flex'>₹{gstAmountTotal.toFixed(2)}</span></td>
                      <td className="px-4 py-1">{item.sgst}% <span className='flex'>₹{sgstAmountTotal.toFixed(2)}</span></td>
                      <td className="px-4 py-1">₹{priceTotal.toFixed(2)}</td>
                      <td className="px-4 py-1">
                        {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)} {getUnitLabel(item.unit)}
                      </td>
                      <td className="px-4 py-1 font-medium">₹{totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleRemove(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Remove"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="14" className="px-4 py-8 text-center text-gray-500">
                    {products.length > 0
                      ? 'No products match your search'
                      : 'No products added yet. Start by adding products above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with total */}
        <div className="absolute bottom-28 left-0 right-0 bg-gray-100 border-t">
          <div className="mx-auto max-w-full px-6 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-sm text-gray-600">
                {filteredProducts.length || 0} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Subtotal: ₹{(filteredProducts.reduce((sum, item) => sum + (item.basicPrice * item.quantity), 0).toFixed(2))}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  GST: ₹{(filteredProducts.reduce((sum, item) => sum + (item.gstAmount * item.quantity), 0).toFixed(2))}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  SGST: ₹{(filteredProducts.reduce((sum, item) => sum + (item.sgstAmount * item.quantity), 0).toFixed(2))}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  Grand Total: ₹{(filteredProducts.length ? calculateTotal() : 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductList;