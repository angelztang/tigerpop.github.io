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
      ? `${API_URL}${queryString.substring(4)}` 
      : `${API_URL}/listings${queryString}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  try {
    // Use default user ID (1) if no user is logged in
    const listingData = {
      ...data,
      user_id: data.user_id || 1
    };

    const response = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(listingData)
    });

    if (!response.ok) {
      throw new Error('Failed to create listing');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: number, data: Partial<CreateListingData>): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/listings/${id}`, {
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
    const response = await fetch(`${API_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete listing');
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

export const updateListingStatus = async (id: number, status: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/listings/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update listing status');
    }
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
};

export const getUserListings = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/listings/user`, {
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
    console.log('Uploading images to:', `${API_URL}/listings/upload`); // Log the URL
    console.log('Number of files:', files.length); // Log number of files
    console.log('Token present:', !!token); // Log if token exists

    const response = await fetch(`${API_URL}/listings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });

    console.log('Upload response status:', response.status); // Log response status

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData?.message || 'Failed to upload images');
      } catch (e) {
        throw new Error(`Failed to upload images: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Upload success, received URLs:', data.urls); // Log successful response
    return data.urls;
  } catch (error) {
    console.error('Detailed upload error:', error);
    throw error;
  }
};
  