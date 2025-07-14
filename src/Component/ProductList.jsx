import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ProductList({ products, onAdd, onEdit, onRemove }) {
  const initialProduct = {
    code: '',
    name: '',
    quantity: '',
    mrp:0,
    gst: 0.0,
    discount: 0.0,
    price: '',
    baseUnit: 'piece',
    selectedUnit: 'piece',
    conversionRate: 1,
    basePrice: 0,
    secondaryPrice: 0,
    isManualPrice: false
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

  // Fetch stock data on component mount
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
        setProduct(prev => ({
          ...prev,
          name: productData.productName || '',
          baseUnit: productData.baseUnit || 'piece',
          selectedUnit: productData.baseUnit || 'piece',
          basePrice: productData.basePrice || productData.mrp || 0,
          secondaryPrice: productData.secondaryPrice || 0,
          conversionRate: productData.conversionRate || 1,
          mrp: productData.basePrice || productData.mrp || 0,
          gst: productData.gst || 0,
          discount: productData.discount || 0,
          quantity: '',
          price: '',
          isManualPrice: false
        }));

        quantityInputRef.current?.focus();
      }
    } catch (err) {
      console.error('Error fetching product details', err);
      setProduct(prev => ({
        ...prev,
        name: '',
        mrp: 0,
        gst: 0,
        discount: 0,
        quantity: '',
        price: '',
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

 // Calculate price when quantity/unit changes
  useEffect(() => {
    if (product.code && product.selectedUnit && product.quantity && !product.isManualPrice) {
      const calculatePrice = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/products/code/${product.code}`);
          const productData = res.data;

          let calculatedMrp = 0;
          const quantity = parseFloat(product.quantity);

          if (product.selectedUnit === productData.baseUnit) {
            calculatedMrp = (productData.basePrice || productData.mrp || 0) * quantity;
          } else if (product.selectedUnit === productData.secondaryUnit && productData.secondaryPrice) {
            calculatedMrp = productData.secondaryPrice * quantity;
          } else if (product.selectedUnit === 'gram' && productData.baseUnit === 'kg' && productData.basePrice) {
            calculatedMrp = (productData.basePrice / 1000) * quantity;
          } else if (product.selectedUnit === 'ml' && productData.baseUnit === 'liter' && productData.basePrice) {
            calculatedMrp = (productData.basePrice / 1000) * quantity;
          } else {
            calculatedMrp = (productData.basePrice || productData.mrp || 0) * quantity;
          }

          // Apply discount first
          const discountedPrice = calculatedMrp - (calculatedMrp * (product.discount / 100));
          // Then add GST
          const priceWithGst = discountedPrice + (discountedPrice * (product.gst / 100));

          setProduct(prev => ({
            ...prev,
            mrp: calculatedMrp,
            price: priceWithGst,
            unit: product.selectedUnit // Make sure to set the unit
          }));
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      };

      calculatePrice();
    } else if (product.isManualPrice) {
      setProduct(prev => ({
        ...prev,
        mrp: parseFloat(prev.price) || 0,
        unit: prev.selectedUnit // Make sure to set the unit
      }));
    }
  }, [product.code, product.selectedUnit, product.quantity, product.discount, product.gst, product.isManualPrice, product.price]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      setProduct(prev => ({ ...prev, [name]: value }));
    } else if (name === 'price') {
      setProduct(prev => ({
        ...prev,
        price: parseFloat(value) || 0,
        mrp: parseFloat(value) || 0, // Set MRP to match manual price
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
      isManualPrice: false,
      price: 0
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
      price: product.price,
      unit: product.selectedUnit, // Include the selected unit
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

  const calculateTotal = () => filteredProducts.reduce((sum, item) => sum + item.price, 0);

  const getUnitLabel = (unitValue) => {
    const unit = unitTypes.find(u => u.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Product Form */}
      <div className="bg-white p-3 mb-2 border border-gray-200 ">
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

          <div className="grid grid-cols-7 gap-2">
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

            {/* MRP */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-700 mb-1">Sales Price</label>
              <input
                type="number"
                name="mrp"
                value={product.mrp}
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

            {/* Price */}
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
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="flex-1 bg-white border border-gray-200  overflow-hidden">
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
                <th className="px-3 py-2 text-left border-b">Price</th>
                <th className="px-3 py-2 text-left border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{index + 1}</td>
                  <td className="px-3 py-2 border-b">{item.code}</td>
                  <td className="px-3 py-2 border-b">{item.name}</td>
                  <td className="px-3 py-2 border-b">{item.mrp}</td>
                  <td className="px-3 py-2 border-b">{item.gst}</td>
                  <td className="px-3 py-2 border-b">
                    {Number.isInteger(item.quantity) ? item.quantity : item.quantity}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {getUnitLabel(item.selectedUnit)}
                  </td>
                  <td className="px-3 py-2 border-b">{item.price.toFixed(2)}</td>
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
                Total: ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;