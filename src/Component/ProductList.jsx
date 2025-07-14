import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ProductList({ products, onAdd, onEdit, onRemove }) {
  const initialProduct = {
    code: '',
    name: '',
    quantity: '',
    mrpPrice: 0,
    gst: 0.0,
    discount: 0.0,
    price: 0,
    baseUnit: 'piece',
    selectedUnit: 'piece',
    conversionRate: 1,
    basePrice: 0,
    secondaryPrice: 0,
    isManualPrice: false,
    totalPrice: 0
  };

  const [product, setProduct] = useState(initialProduct);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockData, setStockData] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const quantityInputRef = useRef(null);
  const addProductButtonRef = useRef(null);
  const priceInputRef = useRef(null);

  // Fetch stock data
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

  const fetchProductDetails = async (productCode) => {
    if (!productCode.trim()) return;
    setIsLoading(true);

    try {
      const res = await axios.get(`http://localhost:5000/api/products/code/${productCode}`);
      const productData = res.data;

      if (productData) {
        const units = [productData.baseUnit];
        if (productData.secondaryUnit) units.push(productData.secondaryUnit);

        setAvailableUnits(units);
        
        // Calculate price based on selected unit
        let price = productData.totalPrice || 0;
        if (product.selectedUnit === productData.baseUnit) {
          price = productData.totalPrice || 0;
        } else if (product.selectedUnit === productData.secondaryUnit) {
          price = productData.totalPrice / productData.conversionRate;
          price = Math.round(price * 100) / 100; // Round to 2 decimal places
        }

        setProduct(prev => ({
          ...prev,
          name: productData.productName || '',
          baseUnit: productData.baseUnit || 'piece',
          basePrice: productData.basePrice || productData.mrpPrice || 0,
          secondaryPrice: productData.secondaryPrice || 0,
          conversionRate: productData.conversionRate || 1,
          mrpPrice: productData.mrpPrice || 0,
          gst: productData.gst || 0,
          discount: productData.discount || 0,
          price: price,
          quantity: '',
          totalPrice: 0,
          isManualPrice: false
        }));

        quantityInputRef.current?.focus();
      }
    } catch (err) {
      console.error('Error fetching product details', err);
      setProduct(prev => ({
        ...prev,
        name: '',
        mrpPrice: 0,
        gst: 0,
        discount: 0,
        price: 0,
        quantity: '',
        totalPrice: 0,
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
      fetchProductDetails(product.code);
    }
  }, [product.code, editingIndex]);

  // Handle unit change separately
  useEffect(() => {
    if (product.code && product.selectedUnit) {
      fetchProductDetails(product.code);
    }
  }, [product.selectedUnit]);

  // Calculate total when quantity or price changes
  useEffect(() => {
    if (product.quantity && product.price) {
      const quantity = parseFloat(product.quantity) || 0;
      const totalPrice = quantity * parseFloat(product.price);
      
      setProduct(prev => ({
        ...prev,
        totalPrice: totalPrice
      }));
    }
  }, [product.quantity, product.price]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      const quantity = parseFloat(value) || 0;
      const totalPrice = quantity * parseFloat(product.price);
      
      setProduct(prev => ({ 
        ...prev, 
        [name]: value,
        totalPrice: totalPrice
      }));
    } else if (name === 'price') {
      const priceValue = parseFloat(value) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      const totalPrice = priceValue * quantity;
      
      setProduct(prev => ({
        ...prev,
        price: priceValue,
        totalPrice: totalPrice,
        isManualPrice: true
      }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUnitChange = (e) => {
    const selectedUnit = e.target.value;
    setProduct(prev => ({ 
      ...prev, 
      selectedUnit, 
      isManualPrice: false
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.code || !product.quantity) {
      toast.error("Product code and quantity are required!");
      return;
    }

    const quantityValue = parseFloat(product.quantity);
    if (isNaN(quantityValue)) {
      toast.error("Please enter a valid quantity!");
      return;
    }

    const newProduct = {
      ...product,
      id: Date.now(),
      quantity: quantityValue,
      price: parseFloat(product.price),
      totalPrice: product.totalPrice,
      unit: product.selectedUnit,
      isManualPrice: product.isManualPrice
    };

    if (editingIndex !== null) {
      onEdit(editingIndex, newProduct);
      setEditingIndex(null);
    } else {
      onAdd(newProduct);
    }

    setProduct(initialProduct);
    searchProductInputRef.current?.focus();
  };

  const handleEdit = (index) => {
    const productToEdit = products[index];
    setProduct({ 
      ...productToEdit,
      quantity: productToEdit.quantity.toString()
    });
    setEditingIndex(index);
    productCodeInputRef.current?.focus();
  };

  const handleRemove = (index) => {
    onRemove(index);
  };

  const filteredProducts = products.filter(
    (item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => filteredProducts.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);

  const getUnitLabel = (unitValue) => {
    const unit = unitTypes.find(u => u.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Product Form */}
      <div className="bg-white p-3 mb-2 border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between space-x-4 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchProductInputRef}
              />
            </div>
            <button
              type="submit"
              className={`px-3 py-1 text-sm rounded ${
                editingIndex !== null ? 'bg-yellow-500' : 'bg-blue-600'
              } text-white`}
              ref={addProductButtonRef}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : editingIndex !== null ? 'Update' : 'Add'} Product
            </button>
          </div>

          <div className="grid grid-cols-8 gap-2">
            {/* Product Code */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Code*</label>
              <input
                type="text"
                name="code"
                value={product.code}
                onChange={handleChange}
                ref={productCodeInputRef}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                required
              />
            </div>

            {/* Product Name */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={product.name}
                readOnly
                className="w-full px-2 py-1 text-sm border bg-gray-100 rounded"
              />
            </div>

            {/* Unit Selection */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Unit</label>
              <select
                name="selectedUnit"
                value={product.selectedUnit}
                onChange={handleUnitChange}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
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
              <label className="block text-xs text-gray-700 mb-1">Qty*</label>
              <input
                type="number"
                name="quantity"
                value={product.quantity}
                onChange={handleChange}
                ref={quantityInputRef}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                required
                pattern="[0-9]*[.,]?[0-9]*"
              />
            </div>

            {/* MRP Price (from DB) */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">MRP Price</label>
              <input
                type="number"
                name="mrpPrice"
                value={product.mrpPrice}
                readOnly
                className="w-full px-2 py-1 text-sm border bg-gray-100 rounded"
              />
            </div>

            {/* GST */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">GST %</label>
              <input
                type="number"
                name="gst"
                value={product.gst}
                onChange={handleChange}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>

            {/* Sales Price */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Sales Price*</label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                ref={priceInputRef}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                required
              />
            </div>

            {/* Total Price */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Total Price</label>
              <input
                type="number"
                name="totalPrice"
                value={product.totalPrice.toFixed(2)}
                readOnly
                className="w-full px-2 py-1 text-sm border bg-gray-100 rounded"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="flex-1 bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left border-b">S.No</th>
                <th className="px-3 py-2 text-left border-b">Code</th>
                <th className="px-3 py-2 text-left border-b">Name</th>
                <th className="px-3 py-2 text-left border-b">MRP</th>
                <th className="px-3 py-2 text-left border-b">GST %</th>
                <th className="px-3 py-2 text-left border-b">Qty</th>
                <th className="px-3 py-2 text-left border-b">Unit</th>
                <th className="px-3 py-2 text-left border-b">Sales Price</th>
                <th className="px-3 py-2 text-left border-b">Total Price</th>
                <th className="px-3 py-2 text-left border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{index + 1}</td>
                  <td className="px-3 py-2 border-b">{item.code}</td>
                  <td className="px-3 py-2 border-b">{item.name}</td>
                  <td className="px-3 py-2 border-b">{item.mrpPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 border-b">{item.gst}</td>
                  <td className="px-3 py-2 border-b">
                    {Number.isInteger(item.quantity) ? item.quantity : item.quantity}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {getUnitLabel(item.selectedUnit)}
                  </td>
                  <td className="px-3 py-2 border-b">{item.price.toFixed(2)}</td>
                  <td className="px-3 py-2 border-b">{item.totalPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 border-b">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with total */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50 px-4 py-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} items
              </span>
              <span className="text-lg font-semibold">
                Grand Total: ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;