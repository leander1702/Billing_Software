import { useState, useEffect } from 'react';

function CustomerDetails({ customer, onSubmit, nextCustomerId }) {
  const [formData, setFormData] = useState({
    id: customer.id || nextCustomerId,
    name: customer.name || '',
    contact: customer.contact || ''
  });

  const [isEditing, setIsEditing] = useState(!customer.id);

  useEffect(() => {
    setFormData({
      id: customer.id || nextCustomerId,
      name: customer.name || '',
      contact: customer.contact || ''
    });
    setIsEditing(!customer.id);
  }, [customer, nextCustomerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setFormData({
      id: customer.id,
      name: customer.name,
      contact: customer.contact
    });
    setIsEditing(true);
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          {customer.id ? 'Customer Details' : 'New Customer'}
        </h2>
        {customer.id && !isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Customer ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                readOnly
                className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contact Number*</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            {customer.id && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              {customer.id ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      ) : customer.id ? (
        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-sm font-medium text-gray-500">Customer ID</label>
            <div className="text-gray-800">{customer.id}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Full Name</label>
            <div className="text-gray-800">{customer.name || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Contact Number</label>
            <div className="text-gray-800">{customer.contact || '-'}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 mx-auto text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="mt-1 text-xs text-gray-500">No customer selected</p>
          <button
            onClick={handleEdit}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Add Customer
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerDetails;