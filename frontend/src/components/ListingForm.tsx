// working
import { API_URL } from '../config';
import { getUserId } from '../services/authService';
// Popup Modal that appears when users click "Create Listing"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing, createListing, updateListing, uploadImages, CreateListingData as ApiCreateListingData } from '../services/listingService';

interface ListingFormProps {
  onSubmit: (data: ApiCreateListingData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<ApiCreateListingData>;
  onClose?: () => void;
}

interface ListingFormData {
  title: string;
  description: string;
  price?: number;
  starting_price?: number;
  category: string;
  condition: string;
  user_id: number;
  pricing_mode: 'fixed' | 'auction';
  images: string[];
  is_auction: boolean;
  min_bid_increment: number;
}

interface FormCreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  pricing_mode: 'fixed' | 'auction';
  starting_price?: number;
}

const categories = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Furniture',
  'Appliances', 
  'Books',
  'Other'
];

const conditions = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

const ListingForm: React.FC<ListingFormProps> = ({ onSubmit, isSubmitting = false, initialData = {}, onClose }) => {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    starting_price: 0,
    category: '',
    condition: 'good',
    user_id: 0,
    pricing_mode: 'fixed',
    images: [],
    is_auction: false,
    min_bid_increment: 1.0,
    ...initialData
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user_id when component mounts
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setFormData(prev => ({
        ...prev,
        user_id: parseInt(userId)
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'starting_price' ? parseFloat(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Create preview URLs
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userId = getUserId();
      const netid = localStorage.getItem('netid');
      
      if (!userId) {
        setError('User not authenticated. Please log in.');
        return;
      }

      if (!netid) {
        setError('User netid not found. Please log in again.');
        return;
      }

      // Convert form data to CreateListingData format
      const createListingData: ApiCreateListingData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        images: formData.images,
        pricing_mode: formData.pricing_mode,
        netid: netid,
        price: formData.pricing_mode === 'auction' ? formData.starting_price : formData.price,
        starting_price: formData.pricing_mode === 'auction' ? formData.starting_price : undefined
      };

      // Validate required fields
      if (!createListingData.title || !createListingData.description || !createListingData.category) {
        setError('Please fill in all required fields');
        return;
      }

      if (createListingData.pricing_mode === 'fixed' && !createListingData.price) {
        setError('Please enter a price for fixed price listings');
        return;
      }

      if (createListingData.pricing_mode === 'auction' && !createListingData.starting_price) {
        setError('Please enter a starting price for auction listings');
        return;
      }

      // Handle image uploads if there are any
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadImages(selectedFiles);
        createListingData.images = uploadedUrls;
      }

      await onSubmit(createListingData);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting the listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-8 m-4 max-w-xl w-full z-50 shadow-xl">
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition:
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">Select condition</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_auction"
                checked={formData.is_auction}
                onChange={(e) => {
                  const isAuction = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    is_auction: isAuction,
                    pricing_mode: isAuction ? 'auction' : 'fixed'
                  }));
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_auction" className="ml-2 block text-sm text-gray-900">
                Accept bids for this item
              </label>
            </div>

            {formData.is_auction ? (
              <div>
                <label htmlFor="starting_price" className="block text-sm font-medium text-gray-700">
                  Starting Price ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="starting_price"
                    name="starting_price"
                    value={formData.starting_price || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        starting_price: isNaN(value) ? undefined : value
                      }));
                    }}
                    step="0.01"
                    min="0.01"
                    required
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0.01"
                    required
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description:
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (jpg, jpeg, png):
            </label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
              >
                Choose Files
              </label>
              <span className="ml-3 text-sm text-gray-500">
                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No file chosen'}
              </span>
            </div>
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
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
              className={`px-4 py-2 text-white rounded-md ${
                isSubmitting
                  ? 'bg-orange-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              } transition-colors`}
            >
              {Object.keys(initialData).length > 0 ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListingForm;
