import { useState, useEffect, useRef } from 'react';
import '../App.css';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';
import Api from '../services/api';
import Swal from 'sweetalert2';
import CalculatorPopup from './CalculatorPopup';
import { FaHistory } from "react-icons/fa";
import Modal from 'react-modal';
import * as ReactDOMClient from 'react-dom/client';
import PrintableBill from './PrintableBill';

function ProductList({ products, onAdd, onEdit, onRemove, transportCharge, paymentMethod, onPaymentMethodChange,
  onTransportChargeChange = (value) => { }, }) {
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
    basicPrice: 0,
    hsnCode: ''
  };

  const [product, setProduct] = useState(initialProduct);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockData, setStockData] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [localTransportCharge, setLocalTransportCharge] = useState(transportCharge);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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
  const hsnCodeInputRef = useRef(null);
  const transportChargeInputRef = useRef(null);
  const historyButtonRef = useRef(null);

  // Track if mouse is over history button
  const [isMouseOverHistory, setIsMouseOverHistory] = useState(false);

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
          price = productData.perUnitPrice || (productData.mrp / product.conversionRate);
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
          isManualPrice: false,
          hsnCode: productData.hsnCode || '' // Set HSN Code from product data
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
        isManualPrice: false,
        hsnCode: ''
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

  useEffect(() => {
    setLocalTransportCharge(transportCharge);
  }, [transportCharge]);

  const handleTransportChargeChange = (e) => {
    let value = e.target.value;

    // Remove leading zeros unless it's just "0" or "0."
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '') || '0';
    }

    // Convert to number and validate
    let numericValue = parseFloat(value) || 0;
    numericValue = Math.max(0, numericValue); // Ensure non-negative
    numericValue = parseFloat(numericValue.toFixed(2)); // Round to 2 decimal places

    setLocalTransportCharge(value); // Keep as string for display
    onTransportChargeChange(numericValue); // Send numeric value to parent
  };

  const handleTransportBlur = () => {
    // When field loses focus, ensure we have a proper number
    const numericValue = parseFloat(localTransportCharge) || 0;
    const formattedValue = numericValue.toFixed(2);

    setLocalTransportCharge(formattedValue);
    onTransportChargeChange(numericValue);
  };

  useEffect(() => {
    if (products.length === 0) {
      setLocalTransportCharge(0);
      onTransportChargeChange(0);
    }
  }, [products.length, onTransportChargeChange]);

  const calculateCurrentBillTotal = () => {
    return products.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateGrandTotal = () => {
    return calculateCurrentBillTotal() + transportCharge;
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
    const numericFields = ['quantity', 'price', 'gst', 'sgst', 'basicPrice', 'mrpPrice', 'hsnCode'];

    let processedValue = value;
    if (numericFields.includes(name) && name !== 'hsnCode') {
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

  const checkStockAvailability = async (productName, quantity, unit) => {
    try {
      // First get the product details including unit conversion rates
      const productRes = await Api.get(`/products/name/${productName}`);
      const product = productRes.data;

      if (!product) {
        return { isAvailable: false, available: 0, availableDisplay: 0 };
      }

      // Get the stock information
      const stockRes = await Api.get(`products/stock/${product.productCode}`);
      const stockData = stockRes.data;
      const availableQuantity = stockData.stock?.availableQuantity || 0;

      // Calculate available quantity in the requested unit
      let availableInRequestedUnit = availableQuantity;
      let isAvailable = true;
      let conversionRate = 1;

      if (unit === product.baseUnit) {
        // For base unit, compare directly
        isAvailable = availableQuantity >= quantity;
        availableInRequestedUnit = availableQuantity;
      } else if (unit === product.secondaryUnit) {
        // For secondary unit, convert to base unit for comparison
        conversionRate = product.conversionRate || 1;
        const requestedQuantityInBase = quantity;
        isAvailable = availableQuantity >= requestedQuantityInBase;
        availableInRequestedUnit = availableQuantity * conversionRate;
      }

      return {
        isAvailable,
        available: availableQuantity,
        availableDisplay: availableInRequestedUnit,
        unit,
        conversionRate
      };
    } catch (err) {
      console.error('Error checking stock:', err);
      return { isAvailable: false, available: 0, availableDisplay: 0 };
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
      const availableInRequestedUnit = stockCheck.availableDisplay.toFixed(2);
      const requestedUnit = product.selectedUnit || product.baseUnit;

      await Swal.fire({
        title: 'Insufficient Stock',
        html: `Only <b>${availableInRequestedUnit} ${requestedUnit}</b> available for <b>${product.name}</b>`,
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
      availableStock: stockCheck.available,
      hsnCode: product.hsnCode
    };

    if (editingIndex !== null) {
      onEdit(editingIndex, newProduct);
      setEditingIndex(null);
    } else {
      onAdd(newProduct);
    }

    setProduct(initialProduct);
    setNameSuggestions([]);

    // Focus on product code input after submission
    setTimeout(() => {
      productCodeInputRef.current?.focus();
    }, 0);
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

  const calculateTotal = () => {
    const productsTotal = filteredProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    return productsTotal + transportCharge;
  };

  const getUnitLabel = (unitValue) => {
    const unit = unitTypes.find(u => u.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  // Add this useEffect for modal accessibility
  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  // Fetch recent bills function
  const fetchRecentBills = async () => {
    try {
      setIsLoadingHistory(true);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const response = await Api.get(`/bills?fromDate=${twentyFourHoursAgo}`);
      const last50Bills = response.data.slice(-50).reverse();
      setRecentBills(last50Bills);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching recent bills:', error);
      toast.error('Failed to load recent bills');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Print bill function
  const handlePrintBill = async (bill) => {
    try {
      const companyRes = await Api.get('/companies');
      const companyDetails = companyRes.data[0];

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          <div id="print-root"></div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

      printWindow.document.close();

      const rootElement = printWindow.document.getElementById('print-root');
      const root = ReactDOMClient.createRoot(rootElement);
      root.render(
        <PrintableBill billData={bill} companyDetails={companyDetails} />
      );
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print bill: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Product Form */}
      <div className="bg-white p-2 border border-gray-200 rounded-sm shadow-sm mb-1">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 ">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search product code or name"
                className="w-full pl-10 pr-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchProductInputRef}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" // Important: Make sure this is type="button" to prevent form submission
                ref={historyButtonRef}
                onClick={fetchRecentBills}
                onMouseEnter={() => setIsMouseOverHistory(true)}
                onMouseLeave={() => setIsMouseOverHistory(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors"
              >
                <FaHistory className="text-base" /> History
              </button>
            </div>
          </div>

          {/* Product Form Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
            {/* Product Code */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="code"
                value={product.code}
                onChange={handleChange}
                ref={productCodeInputRef}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg max-h-60 overflow-auto">
                  {nameSuggestions.map((item, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm"
                      onClick={() => handleSelectNameSuggestion(item)}
                    >
                      <div className="font-medium">{item.productName}</div>
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
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Qty <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="quantity"
                value={product.quantity}
                onChange={handleChange}
                ref={quantityInputRef}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addProductButtonRef.current?.click();
                  }
                }}
              />
            </div>

            {/* Basic Price */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Basic Price</label>
              <input
                type="text"
                name="basicPrice"
                value={product.basicPrice.toFixed(2)}
                readOnly
                className="w-full px-3 py-1 text-sm border bg-gray-50 rounded-sm"
              />
            </div>

            {/* GST */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">CGST %</label>
              <input
                type="text"
                name="gst"
                value={product.gst}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price */}
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                inputMode="decimal"
                step="0.01"
                min="0"
                ref={priceInputRef}
                className="no-arrows w-full px-3 py-1 text-sm border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-1 text-sm border bg-gray-50 rounded-sm font-medium text-blue-600"
              />
            </div>
          </div>

          {/* Add/Update Product Button */}
          <div className="flex justify-end ">
            <button
              type="submit"
              className={`px-4 py-1 text-sm font-medium rounded-sm shadow-sm flex items-center gap-2 transition-colors ${editingIndex !== null
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              ref={addProductButtonRef}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Processing...
                </>
              ) : editingIndex !== null ? (
                <>
                  <FiEdit2 />
                  Update Product
                </>
              ) : (
                <>
                  <FiPlus />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }} >
          <table className="min-w-full border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">S.No</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Code</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Name</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">HSN Code</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">MRP</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Basic Price</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">CGST% </th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">SGST% </th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Price</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Qty/unit</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Total</th>
                <th className="px-4 py-1 text-left border-b font-medium text-gray-700">Action</th>
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
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.code}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.hsnCode}</td>
                      <td className="px-4 py-3">₹{item.mrpPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">₹{basicPriceTotal.toFixed(2)}</td>
                      <td className="px-4 py-3">{item.gst}% </td>
                      <td className="px-4 py-3">{item.sgst}% </td>
                      <td className="px-4 py-3">₹{priceTotal.toFixed(2)}</td>
                      <td className="px-4 py-3">
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
        {/* Transport Charge Input */}
        <div className="bg-gray-50 p-2 border-t">
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full'>
            <div>
              <button
                onClick={() => setShowCalculator(true)}
                className="px-3 py-1.5 text-sm font-normal text-white bg-gray-500 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                Calculator
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  onPaymentMethodChange(e.target.value); // Notify parent
                }}
                className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Transport Charge (Right) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Transport Charge:
              </label>
              <input
                type="text" // Changed from "number" to "text" for better control
                value={localTransportCharge}
                onChange={handleTransportChargeChange}
                onBlur={handleTransportBlur}
                inputMode="decimal" // Shows numeric keypad on mobile
                step="0.01"
                min="0"
                className="w-full sm:w-32 no-arrows px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                ref={transportChargeInputRef}
              />
            </div>

            {/* Calculator Popup Component */}
            {showCalculator && (
              <CalculatorPopup
                onClose={() => setShowCalculator(false)}
                onCalculate={(result) => {
                  // Handle the calculation result if needed
                  setShowCalculator(false);
                }}
              />
            )}
          </div>

          {/* Footer with total */}
          <div className="bg-gray-50 py-2 mt-2 border-t">
            <div className="flex flex-col gap-3">
              {/* Item count - now at top */}
              <span className="text-sm text-gray-600 text-start sm:text-left">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>

              {/* Totals - stacked on mobile */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Tax breakdown - in a 2-column layout */}
                <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:flex sm:items-center sm:gap-6">
                  <div className="flex justify-between sm:hidden">
                    <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                    <span className="text-sm text-gray-700">
                      ₹{filteredProducts.reduce((sum, item) => sum + (item.basicPrice * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-gray-700">
                      Subtotal: ₹{filteredProducts.reduce((sum, item) => sum + (item.basicPrice * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between sm:hidden">
                    <span className="text-sm font-medium text-gray-700">CGST:</span>
                    <span className="text-sm text-gray-700">
                      ₹{filteredProducts.reduce((sum, item) => sum + (item.gstAmount * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-gray-700">
                      CGST: ₹{filteredProducts.reduce((sum, item) => sum + (item.gstAmount * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between sm:hidden">
                    <span className="text-sm font-medium text-gray-700">SGST:</span>
                    <span className="text-sm text-gray-700">
                      ₹{filteredProducts.reduce((sum, item) => sum + (item.sgstAmount * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-gray-700">
                      SGST: ₹{filteredProducts.reduce((sum, item) => sum + (item.sgstAmount * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  {transportCharge > 0 && (
                    <div className="flex justify-between sm:hidden">
                      <span className="text-sm font-medium text-gray-700">Transport:</span>
                      <span className="text-sm text-gray-700">
                        ₹{transportCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {transportCharge > 0 && (
                    <div className="hidden sm:block">
                      <span className="text-sm font-medium text-gray-700">
                        Transport: ₹{transportCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grand total - now more prominent */}
                <div className="mt-2 sm:mt-0">
                  <div className="flex justify-between sm:block">
                    <span className="text-sm font-bold text-gray-700 ">Grand Total:</span>
                    <span className="text-lg font-bold text-blue-600 pl-2">₹{calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showHistoryModal}
        onRequestClose={() => setShowHistoryModal(false)}
        contentLabel="Recent Bills"
        className="modal bg-white rounded-lg p-4 max-w-4xl mx-auto my-8 max-h-[80vh] overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Bills (Last 24 Hours)</h2>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <FiRefreshCw className="animate-spin text-blue-500 text-2xl" />
            </div>
          ) : recentBills.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bills found in the last 24 hours</p>
          ) : (
            <div className="space-y-4">
              {recentBills.map((bill) => (
                <div key={bill._id} className="border p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {bill.customer?.name || 'Unknown Customer'} - {bill.billNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(bill.createdAt).toLocaleString()} -
                        Total: ₹{bill.grandTotal?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm"
                    >
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
export default ProductList;
