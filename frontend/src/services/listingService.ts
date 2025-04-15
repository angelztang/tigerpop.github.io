// Handles fetching, creating, and updating listings (API calls)

import axios from 'axios';
import { getUserId } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
  isHearted?: boolean;
  user_id: number;
  user_netid: string;
  created_at: string;
  updated_at: string;
  images: string[];
  condition: string;
  seller_id: number;
  buyer_id?: number;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  user_id: number;
  condition: string;
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
  try {
    const url = filters ? `${API_URL}/api/listing${filters}` : `${API_URL}/api/listing`;
    const response = await axios.get<Listing[]>(url, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
};

export const getListing = async (id: number): Promise<Listing | null> => {
  try {
    const response = await axios.get<Listing>(`${API_URL}/api/listing/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  const response = await axios.post<Listing>(`${API_URL}/api/listing`, data, getAuthHeaders());
  return response.data;
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  const response = await axios.put<Listing>(`${API_URL}/api/listing/${id}`, data, getAuthHeaders());
  return response.data;
};

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  const response = await axios.patch<Listing>(`${API_URL}/api/listing/${id}/status`, { status });
  return response.data;
};

export const deleteListing = async (id: number): Promise<void> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  await axios.delete(`${API_URL}/api/listing/${id}?user_id=${userId}`, getAuthHeaders());
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
        ...getAuthHeaders().headers,
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
  const response = await axios.get<string[]>(`${API_URL}/api/listing/categories`, getAuthHeaders());
  return response.data;
};

export const getUserListings = async (userId: string): Promise<Listing[]> => {
  try {
    const response = await axios.get<Listing[]>(`${API_URL}/api/listing/user?user_id=${userId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return [];
  }
};

export const requestToBuy = async (listingId: number): Promise<any> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const response = await axios.post(`${API_URL}/api/listing/${listingId}/buy`, {
      buyer_id: userId,
      message: 'I am interested in this item',
      contact_info: 'Please contact me via email'
    }, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  const response = await axios.get<Listing[]>(`${API_URL}/api/listing/purchases`, getAuthHeaders());
  return response.data;
};

export const getBuyerListings = async (userId: string): Promise<Listing[]> => {
  try {
    const response = await axios.get<Listing[]>(`${API_URL}/api/listing/buyer?user_id=${userId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching buyer listings:', error);
    return [];
  }
};

export const heartListing = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to heart listings');
    }
    await axios.post(`${API_URL}/api/listing/${id}/heart`, {}, getAuthHeaders());
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please log in to heart listings');
    }
    throw new Error('Failed to heart listing');
  }
};

export const unheartListing = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to unheart listings');
    }
    await axios.delete(`${API_URL}/api/listing/${id}/heart`, getAuthHeaders());
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please log in to unheart listings');
    }
    throw new Error('Failed to unheart listing');
  }
};

export const getHeartedListings = async (): Promise<Listing[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return [];
    }
    const response = await axios.get<Listing[]>(`${API_URL}/api/listing/hearted`, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return [];
    }
    if (error.response?.status === 422) {
      console.warn('Failed to fetch hearted listings (422):', error.response?.data);
      return [];
    }
    console.error('Error fetching hearted listings:', error);
    return [];
  }
};
  