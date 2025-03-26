import { API_URL } from '../config';
// Popup Modal that appears when users click "Create Listing"
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing, uploadImages } from '../services/listingService';

interface ListingFormProps {
  onClose?: () => void;
}

const categories = [
  'tops',
  'bottoms',
  'shoes',
  'dresses',
  'fridges',
  'couches',
  'textbooks',
  'other'
];

const ListingForm: React.FC<ListingFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      // Revoke old URLs to prevent memory leaks
      prev.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      setUploading(true);
      
      let imageUrls: string[] = [];
      
      // Only attempt to upload images if they exist
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('images', file);
        });

        const response = await fetch(`${API_URL}/api/listings/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload images');
        }

        const data = await response.json();
        imageUrls = data.urls;
      }

      const response = await createListing({
        ...formData,
        price: parseFloat(formData.price),
        image_urls: imageUrls,
        user_id: 1 // Using default user ID for now
      });

      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      // Show success message
      setMessage({ text: 'Listing created successfully!', type: 'success' });
      
      // Wait for 2 seconds to show the success message before redirecting
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        navigate('/listings');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      setMessage({ text: 'Failed to create listing. Please try again.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title:</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category:</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price:</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Images:</label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-orange-50 file:text-orange-700
            hover:file:bg-orange-100"
        />
        {previewUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(url);
                    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={uploading}
          className={`px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
          }`}
        >
          {uploading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
};

export default ListingForm;
