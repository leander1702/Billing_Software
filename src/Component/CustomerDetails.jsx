import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

function CustomerDetails({ customer, onSubmit, onFocusCustomerName, onFocusPhoneNumber }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    contact: '',
    aadhaar: '',
    location: ''
  });
  const [isEditing, setIsEditing] = useState(true);
  const [foundInDB, setFoundInDB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create internal refs for the input fields
  const contactInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const locationInputRef = useRef(null);

  // Expose internal focus functions via the props received from BillingSystem
  const focusCustomerName = useCallback(() => {
    nameInputRef.current?.focus();
  }, []);

  const focusPhoneNumber = useCallback(() => {
    contactInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (onFocusCustomerName) onFocusCustomerName.current = focusCustomerName;
    if (onFocusPhoneNumber) onFocusPhoneNumber.current = focusPhoneNumber;
  }, [onFocusCustomerName, onFocusPhoneNumber, focusCustomerName, focusPhoneNumber]);

  useEffect(() => {
    if (!customer?.contact && !customer?.name) {
      // If both contact and name are empty, reset form
      setFormData({ 
        name: '', 
        contact: '',
        aadhaar: '',
        location: ''
      });
      setFoundInDB(false);
      setIsEditing(true);
    } else {
      setFormData({
        name: customer.name || '',
        contact: customer.contact || '',
        aadhaar: customer.aadhaar || '',
        location: customer.location || ''
      });
      setFoundInDB(!!customer?.id);
      setIsEditing(!customer?.id);
    }
  }, [customer]);

  const handleContactChange = async (e) => {
    const contact = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, contact }));

    if (contact.length === 10) {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/customers?contact=${contact}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            toast.success(`Existing customer found: ${data.name}`);
            setFormData({
              name: data.name || '',
              contact: data.contact || '',
              aadhaar: data.aadhaar || '',
              location: data.location || ''
            });
            setFoundInDB(true);
            setIsEditing(false);
            onSubmit({
              ...data,
              aadhaar: data.aadhaar || '',
              location: data.location || ''
            });
          }
        } else if (res.status === 404) {
          setFormData(prev => ({ 
            ...prev, 
            name: '',
            aadhaar: '',
            location: ''
          }));
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
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const handleAadhaarChange = (e) => {
    // Format Aadhaar as XXXX-XXXX-XXXX while typing
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formattedValue = value;
    
    if (value.length > 4) {
      formattedValue = `${value.slice(0, 4)}-${value.slice(4, 8)}`;
      if (value.length > 8) {
        formattedValue += `-${value.slice(8)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, aadhaar: formattedValue }));
  };

  const handleLocationChange = (e) => {
    setFormData(prev => ({ ...prev, location: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, contact, aadhaar, location } = formData;

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
        body: JSON.stringify({ 
          name, 
          contact,
          aadhaar: aadhaar.replace(/-/g, ''), // Remove dashes before saving
          location 
        })
      });

      const data = await res.json();

      if (res.status === 201) {
        toast.success('Customer saved successfully');
        setFormData({
          name: data.name || '',
          contact: data.contact || '',
          aadhaar: data.aadhaar || '',
          location: data.location || ''
        });
        setFoundInDB(true);
        setIsEditing(false);
        onSubmit({
          ...data,
          aadhaar: data.aadhaar || '',
          location: data.location || ''
        });
      } else if (res.status === 409) {
        toast.info('Customer already exists');
        setFormData({
          name: data.customer.name || '',
          contact: data.customer.contact || '',
          aadhaar: data.customer.aadhaar || '',
          location: data.customer.location || ''
        });
        setFoundInDB(true);
        setIsEditing(false);
        onSubmit({
          ...data.customer,
          aadhaar: data.customer.aadhaar || '',
          location: data.customer.location || ''
        });
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
              ref={contactInputRef}
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
            ref={nameInputRef}
          />
        </div>

        {/* Aadhaar Number (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aadhaar Number
          </label>
          <input
            type="text"
            value={formData.aadhaar}
            onChange={handleAadhaarChange}
            disabled={!isEditing || isLoading}
            className="w-full py-1 px-2 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="XXXX-XXXX-XXXX"
            maxLength="14" // 12 digits + 2 hyphens
            ref={aadhaarInputRef}
          />
        </div>

        {/* Location (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={handleLocationChange}
            disabled={!isEditing || isLoading}
            className="w-full py-1 px-2 text-sm border border-gray-300 rounded-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="Enter location"
            ref={locationInputRef}
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-1.5 px-3 text-sm font-medium text-white rounded-sm shadow-sm ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
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