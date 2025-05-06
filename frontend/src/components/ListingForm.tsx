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
  maxImages?: number;
  selectedFiles?: File[];
  onSelectedFilesChange?: (files: File[]) => void;
  onImageRemove?: (index: number) => void;
}

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  user_id: number;
  pricing_mode: 'fixed' | 'auction' | 'Fixed' | 'Auction' | 'FIXED' | 'AUCTION';
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
  pricing_mode: 'fixed' | 'auction' | 'Fixed' | 'Auction' | 'FIXED' | 'AUCTION';
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
  'Used'
];

const MAX_IMAGES = 10;

const ListingForm: React.FC<ListingFormProps> = ({ 
  onSubmit, 
  isSubmitting = false, 
  initialData = {}, 
  onClose, 
  maxImages = 10,
  selectedFiles: externalSelectedFiles = [],
  onSelectedFilesChange,
  onImageRemove
}) => {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    category: '',
    condition: 'good',
    user_id: 0,
    pricing_mode: 'fixed',
    images: [],
    is_auction: false,
    min_bid_increment: 1.0,
    ...initialData
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>(externalSelectedFiles);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const CHARACTER_LIMIT = 150;
  const TITLE_LIMIT = 100;
  const DESCRIPTION_LIMIT = 1000;
  const MIN_PRICE = 1;
  const MAX_PRICE = 1000000000; // 1 billion

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

  // Initialize preview URLs when selectedFiles changes
  useEffect(() => {
    const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);

    // Cleanup function to revoke object URLs
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle character limits
    if (name === 'title' && value.length > TITLE_LIMIT) {
      setError(`Title cannot exceed ${TITLE_LIMIT} characters`);
      return;
    }
    if (name === 'description' && value.length > DESCRIPTION_LIMIT) {
      setError(`Description cannot exceed ${DESCRIPTION_LIMIT} characters`);
      return;
    }

    // Handle price input
    if (name === 'price') {
      // Allow empty value for backspacing
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
        return;
      }

      // Allow decimal inputs like ".04"
      const priceValue = value === '.' ? 0 : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(priceValue) ? 0 : priceValue
      }));
      return;
    }

    if (type === 'checkbox') {
      const isAuction = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        is_auction: isAuction,
        pricing_mode: isAuction ? 'auction' : 'fixed'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null); // Clear any previous errors when input is valid
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalFiles = selectedFiles.length + files.length;
      
      // Check file types
      const invalidFiles = files.filter(file => {
        const fileType = file.type.toLowerCase();
        return !['image/jpeg', 'image/jpg', 'image/png'].includes(fileType);
      });

      if (invalidFiles.length > 0) {
        setError('Only JPG, JPEG, and PNG files are allowed.');
        return;
      }
      
      if (totalFiles > maxImages) {
        setError(`You can only upload up to ${maxImages} images. You currently have ${selectedFiles.length} images and tried to add ${files.length} more.`);
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...files]);
      if (onSelectedFilesChange) {
        onSelectedFilesChange([...selectedFiles, ...files]);
      }
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (onSelectedFilesChange) {
        onSelectedFilesChange(newFiles);
      }
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingLocal(true);

    try {
      // Validate form data
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (formData.title.length > TITLE_LIMIT) {
        setError(`Title cannot exceed ${TITLE_LIMIT} characters`);
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }
      if (formData.description.length > DESCRIPTION_LIMIT) {
        setError(`Description cannot exceed ${DESCRIPTION_LIMIT} characters`);
        return;
      }
      if (!formData.category) {
        setError('Category is required');
        return;
      }
      if (!formData.condition) {
        setError('Condition is required');
        return;
      }
      if (formData.price === undefined || formData.price === null || formData.price < MIN_PRICE) {
        setError(`Price must be at least $${MIN_PRICE}`);
        return;
      }
      if (formData.price > MAX_PRICE) {
        setError(`Price cannot exceed $${MAX_PRICE.toLocaleString()}`);
        return;
      }

      // Upload images if there are any
      let imageUrls = [...formData.images];
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadImages(selectedFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      // Prepare the data for submission
      const submitData: ApiCreateListingData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        condition: formData.condition,
        images: imageUrls,
        pricing_mode: formData.pricing_mode as 'fixed' | 'auction' | 'Fixed' | 'Auction' | 'FIXED' | 'AUCTION',
        netid: localStorage.getItem('netid') || '',
        user_id: formData.user_id
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the listing');
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="relative bg-white rounded-lg p-8 m-4 max-w-xl w-full z-50 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmittingLocal}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Fields marked with an asterisk (*) are mandatory</p>

        {error && !error.toLowerCase().includes('image') && !error.toLowerCase().includes('price') && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <span className="text-sm text-gray-500">
                {formData.title.length}/{TITLE_LIMIT} characters
              </span>
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={isSubmittingLocal}
              maxLength={TITLE_LIMIT}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
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
              Condition <span className="text-red-500">*</span>
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
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_auction" className="ml-2 block text-sm text-gray-700">
                Accept bids for this item
              </label>
            </div>

            {formData.is_auction && (
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Auction Item</h3>
                <p className="text-gray-700">
                  This item will be sold through an auction. You cannot edit the price once bids are placed. The highest bidder will win when the auction ends (which will be indicated by the seller). When the seller closes the auction, the highest bidder will recieve an email indicating so, and other bidders will recieve an email notifying them they did not recieve the item.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.is_auction ? 'Starting Price' : 'Price'} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step="0.01"
                  disabled={isSubmittingLocal}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
              {error && (error.includes('Price must be at least') || error.includes('Price cannot exceed')) && (
                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Price must be between ${MIN_PRICE} and ${MAX_PRICE.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Please include the size of the item if applicable)<span className="text-red-500">*</span>
              </label>
              <span className="text-sm text-gray-500">
                {formData.description.length}/{DESCRIPTION_LIMIT} characters
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              maxLength={DESCRIPTION_LIMIT}
              disabled={isSubmittingLocal}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images ({selectedFiles.length}/{maxImages})
            </label>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isSubmittingLocal}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {error && error.includes('images') && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                className="hidden"
                id="images"
                disabled={selectedFiles.length >= maxImages || isSubmittingLocal}
              />
              <label
                htmlFor="images"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  selectedFiles.length >= maxImages || isSubmittingLocal
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                Add Images
              </label>
              <span className="text-sm text-gray-500">
                {selectedFiles.length}/{maxImages} images chosen
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Accepted formats: JPG, JPEG, PNG</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingLocal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingLocal}
              className={`px-4 py-2 text-white rounded-md flex items-center justify-center min-w-[120px] ${
                isSubmittingLocal
                  ? 'bg-orange-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              } transition-colors`}
            >
              {isSubmittingLocal ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                Object.keys(initialData).length > 0 ? 'Update Listing' : 'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListingForm;
