// working
import { API_URL } from '../config';
// Popup Modal that appears when users click "Create Listing"
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, createListing, updateListing, uploadImages, CreateListingData } from '../services/listingService';

interface ListingFormProps {
  onSubmit: (data: ListingFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<ListingFormData>;
  onClose?: () => void;
}

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  images: string[];
}

const categories = [
  'Books',
  'Electronics',
  'Furniture',
  'Clothing',
  'Other'
];

const ListingForm: React.FC<ListingFormProps> = ({ onSubmit, isSubmitting = false, initialData = {}, onClose }) => {
  const [formData, setFormData] = useState<ListingFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    price: initialData.price || '',
    category: initialData.category || '',
    images: initialData.images || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg p-8 m-4 max-w-xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title:
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category:
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description:
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price:
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                pattern="^\d+(\.\d{1,2})?$"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (jpg, jpeg, png):
            </label>
            <div className="mt-1">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Choose Files
              </button>
              <span className="ml-3 text-sm text-gray-500">No file chosen</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Accepted formats: JPG, JPEG, PNG</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-md ${
                isSubmitting
                  ? 'bg-orange-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              } transition-colors`}
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListingForm;
