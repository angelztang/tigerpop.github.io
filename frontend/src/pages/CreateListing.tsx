import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingForm from '../components/ListingForm';
import { createListing, CreateListingData } from '../services/listingService';
import { getUserId } from '../services/authService';

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  condition: string;
  user_id: number;
  netid: string;
  pricing_mode: string;
  starting_price?: number;
}

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: CreateListingData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createListing(formData);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      console.error('Error creating listing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Create New Listing</h1>
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Fields marked with an asterisk (*) are mandatory
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <ListingForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onClose={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateListing; 