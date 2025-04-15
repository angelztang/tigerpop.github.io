// Handles fetching, creating, and updating listings (API calls)

import api from './api';
import { getUserId } from './authService';

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
    const url = filters ? `/listing${filters}` : '/listing';
    const response = await api.get<Listing[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
};

export const getListing = async (id: number): Promise<Listing | null> => {
  try {
    const response = await api.get<Listing>(`/listing/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  try {
    const response = await api.post<Listing>('/listing', data);
    return response.data;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  try {
    const response = await api.put<Listing>(`/listing/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  try {
    const response = await api.patch<Listing>(`/listing/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
};

export const deleteListing = async (id: number): Promise<void> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await api.delete(`/listing/${id}?user_id=${userId}`);
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post<{ urls: string[] }>('/listing/upload', formData, {
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
  try {
    const response = await api.get<string[]>('/listing/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getUserListings = async (userId: string): Promise<Listing[]> => {
  try {
    const response = await api.get<Listing[]>(`/listing/user?user_id=${userId}`);
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
    const response = await api.post(`/listing/${listingId}/buy`, {
      buyer_id: userId,
      message: 'I am interested in this item',
      contact_info: 'Please contact me via email'
    });
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  try {
    const response = await api.get<Listing[]>('/listing/purchases');
    return response.data;
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return [];
  }
};

export const getBuyerListings = async (userId: string): Promise<Listing[]> => {
  try {
    const response = await api.get<Listing[]>(`/listing/buyer?user_id=${userId}`);
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
    await api.post(`/listing/${id}/heart`, {});
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
    await api.delete(`/listing/${id}/heart`);
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
    const response = await api.get<Listing[]>('/listing/hearted');
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
  