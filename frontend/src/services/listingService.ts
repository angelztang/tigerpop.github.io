// Handles fetching, creating, and updating listings (API calls)

import { API_URL } from '../config';
import { getToken } from './authService';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  image_url?: string;
}

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getListings = async (): Promise<Listing[]> => {
  const response = await fetch(`${API_URL}/api/listings`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  return response.json();
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create listing');
  }

  return response.json();
};

export const updateListing = async (id: number, data: Partial<CreateListingData>): Promise<Listing> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update listing');
  }

  return response.json();
};

export const deleteListing = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete listing');
  }
};

export const updateListingStatus = async (id: number, status: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/listings/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update listing status');
  }
};

export const getUserListings = async (): Promise<Listing[]> => {
  const response = await fetch(`${API_URL}/api/listings/user`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user listings');
  }
  
  return response.json();
};
  