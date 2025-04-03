// Handles fetching, creating, and updating listings (API calls)

import { API_URL } from '../config';
import { getToken } from './authService';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  status: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category?: string;
  image_urls?: string[];
  user_id?: number;
}

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

export const getListings = async (queryString: string = ''): Promise<Listing[]> => {
  try {
    const url = queryString.startsWith('/api') 
      ? `${API_URL}${queryString}` 
      : `${API_URL}/api/listings${queryString}`;
    
    console.log('Fetching listings from:', url); // Debug log
    console.log('Current environment:', process.env.NODE_ENV); // Debug log
    console.log('API_URL:', API_URL); // Debug log
    
    const headers = {
      ...getAuthHeaders(),
      'Accept': 'application/json'
    };
    console.log('Request headers:', headers); // Debug log
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: headers,
      mode: 'cors' // Explicitly set CORS mode
    });
    
    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received listings:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    if (error instanceof TypeError) {
      console.error('Network error details:', {
        message: error.message,
        stack: error.stack,
        url: API_URL
      });
    }
    throw error;
  }
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create listing');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: number, data: Partial<CreateListingData>): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update listing');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

export const deleteListing = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/listings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to delete listing');
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

export const updateListingStatus = async (id: number, status: string): Promise<void> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to update listing status');
    }
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
};

export const getUserListings = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/api/listings/user`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user listings');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user listings:', error);
    throw error;
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const token = getToken();
    const response = await fetch(`${API_URL}/api/listings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to upload images');
    }

    const data = await response.json();
    return data.urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const purchaseListing = async (listingId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/listings/${listingId}/purchase`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to purchase listing');
    }

    // The backend will handle sending the email notification to the seller
    return response.json();
  } catch (error) {
    console.error('Error purchasing listing:', error);
    throw error;
  }
};
  