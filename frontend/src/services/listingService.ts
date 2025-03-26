// Handles fetching, creating, and updating listings (API calls)

import { API_URL } from '../config';
import { getToken } from './authService';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  image_urls?: string[];
}

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getListings = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/listings`, {
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
    const response = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
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

    const response = await fetch(`${API_URL}/listings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    const data = await response.json();
    return data.urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};
  