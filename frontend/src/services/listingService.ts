// Handles fetching, creating, and updating listings (API calls)

import axios from 'axios';
import { API_URL } from '../config';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  user_id: number;
  user_netid: string;
  created_at: string;
  images: string[];
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  user_id: number;
}

export interface ListingFilters {
  max_price?: number;
  min_price?: number;
  category?: string;
  condition?: string;
  search?: string;
  include_sold?: boolean;
}

export const getListings = async (filters?: string): Promise<Listing[]> => {
  const url = filters ? `${API_URL}/api/listing${filters}` : `${API_URL}/api/listing`;
  const response = await axios.get<Listing[]>(url);
  return response.data;
};

export const getListing = async (id: number): Promise<Listing> => {
  const response = await axios.get<Listing>(`${API_URL}/api/listing/${id}`);
  return response.data;
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  const formData = new FormData();
  
  // Add listing data
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('price', data.price.toString());
  formData.append('category', data.category);
  formData.append('user_id', data.user_id.toString());
  
  // Add images if provided
  if (data.images && data.images.length > 0) {
    formData.append('images', JSON.stringify(data.images));
  }
  
  const response = await axios.post<Listing>(`${API_URL}/api/listing`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  const formData = new FormData();
  
  // Add listing data
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.price) formData.append('price', data.price.toString());
  if (data.category) formData.append('category', data.category);
  if (data.images) formData.append('images', JSON.stringify(data.images));
  
  // Add user_id
  const userId = localStorage.getItem('user_id');
  if (userId) formData.append('user_id', userId);
  
  const response = await axios.put<Listing>(`${API_URL}/api/listing/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  const response = await axios.patch<Listing>(`${API_URL}/api/listing/${id}/status`, { status });
  return response.data;
};

export const deleteListing = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_URL}/api/listing/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await axios.post<{ urls: string[] }>(`${API_URL}/api/listing/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.urls || !Array.isArray(response.data.urls)) {
      throw new Error('Invalid response format from server');
    }

    return response.data.urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<string[]> => {
  const response = await axios.get<string[]>(`${API_URL}/api/listing/categories`);
  return response.data;
};

export const getUserListings = async (userId: string): Promise<Listing[]> => {
  const response = await axios.get<Listing[]>(`${API_URL}/api/listing/user?user_id=${userId}`);
  return response.data;
};

export const requestToBuy = async (listingId: number): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/api/listing/${listingId}/notify`);
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  const response = await axios.get<Listing[]>(`${API_URL}/api/listing/purchases`);
  return response.data;
};
  