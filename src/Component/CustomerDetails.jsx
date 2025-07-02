import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function CustomerDetails({ customer, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [isEditing, setIsEditing] = useState(true);
  const [foundInDB, setFoundInDB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      setFoundInDB(!!customer?.id);
      setIsEditing(!customer?.id);
    }
  }, [customer]);

  const handleContactChange = async (e) => {
    const contact = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, contact }));

    if (contact.length === 10) {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/customers?contact=${contact}`);
        if (res.ok) {
          const data = await res.json();
          toast.success(`Existing customer found: ${data.name}`);
          setFormData(data);
          setFoundInDB(true);
          setIsEditing(false);
          onSubmit(data);
        } else if (res.status === 404) {
          setFormData((prev) => ({ ...prev, name: '' }));
          setFoundInDB(false);
          setIsEditing(true);
          toast.info('New customer - please enter details');
        }
      } catch (err) {
        toast.error('Error searching for customer');
      } finally {
        setIsLoading(false);
      }
    } else {
      setFoundInDB(false);
      setIsEditing(true);
    }
  };

  const handleNameChange = (e) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, contact } = formData;

    if (!name.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (contact.length !== 10) {
      toast.error('Please enter 10-digit contact number');
      return;
    }

    if (foundInDB) {
      onSubmit(formData);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact })
      });

      const data = await res.json();

      if (res.status === 201) {
        toast.success('Customer saved successfully');
        setFormData(data);
        setFoundInDB(true);
        onSubmit(data);
      } else if (res.status === 409) {
        toast.info('Customer already exists');
        setFormData(data.customer);
        setFoundInDB(true);
        onSubmit(data.customer);
      } else {
        throw new Error(data.message || 'Failed to save customer');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-sm">
      <h2 className="text-sm font-semibold pb-1">Customer Details</h2>
      <div className="border-t border-gray-100 mb-2"></div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-gray-500 pointer-events-none">
              +91
            </div>
            <input
              type="tel"
              value={formData.contact}
              onChange={handleContactChange}
              className="pl-10 w-full py-1 px-2 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="9876543210"
              maxLength="10"
              required
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-2 flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            disabled={!isEditing || isLoading}
            className="w-full py-1 px-2 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="Enter customer name"
            required
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-1.5 px-3 text-sm font-medium text-white rounded-sm shadow-sm ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
        >
          {isLoading ? (
            'Processing...'
          ) : foundInDB ? (
            'Continue with Existing Customer'
          ) : (
            'Save New Customer'
          )}
        </button>
      </form>
    </div>
  );
}

export default CustomerDetails;
