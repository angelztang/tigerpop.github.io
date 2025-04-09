// Handles fetching, creating, and updating listings (API calls)

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
  const response = await api.get<Listing[]>(url);
  return response.data;
};

export const getListing = async (id: number): Promise<Listing> => {
  const response = await api.get<Listing>(`${API_URL}/api/listing/${id}`);
  return response.data;
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  const response = await api.post<Listing>(`${API_URL}/api/listing`, data);
  return response.data;
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  const response = await api.put<Listing>(`${API_URL}/api/listing/${id}`, data);
  return response.data;
};

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  const response = await api.put<Listing>(`${API_URL}/api/listing/${id}/status`, { status });
  return response.data;
};

export const deleteListing = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/api/listing/${id}`);
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await api.post<{ urls: string[] }>(`${API_URL}/api/listing/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.urls;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>(`${API_URL}/api/listing/categories`);
  return response.data;
};

export const getUserListings = async (userId: string): Promise<Listing[]> => {
  const response = await api.get<Listing[]>(`${API_URL}/api/listing/user/${userId}`);
  return response.data;
};

export const requestToBuy = async (listingId: number): Promise<any> => {
  const response = await api.post(`${API_URL}/api/listing/${listingId}/request`);
  return response.data;
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  const response = await api.get<Listing[]>(`${API_URL}/api/listing/purchases`);
  return response.data;
};
  