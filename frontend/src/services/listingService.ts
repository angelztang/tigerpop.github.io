// Handles fetching, creating, and updating listings (API calls)

import { API_URL } from '../config';

export interface Listing {
  id?: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  created_at?: string;
  updated_at?: string;
  seller_id?: number;
  images: string[];
  status?: 'active' | 'pending' | 'sold' | 'removed';
  views?: number;
}

export interface ListingFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  search?: string;
}

export const getListings = async (filters?: ListingFilters): Promise<Listing[]> => {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.min_price) queryParams.append('min_price', filters.min_price.toString());
  if (filters?.max_price) queryParams.append('max_price', filters.max_price.toString());
  if (filters?.condition) queryParams.append('condition', filters.condition);
  if (filters?.search) queryParams.append('search', filters.search);

  const response = await fetch(`${API_URL}/listings?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  return response.json();
};

export const createListing = async (listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing> => {
  const response = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listing),
  });
  if (!response.ok) {
    throw new Error('Failed to create listing');
  }
  return response.json();
};

export const updateListing = async (id: number, listing: Partial<Listing>): Promise<Listing> => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listing),
  });
  if (!response.ok) {
    throw new Error('Failed to update listing');
  }
  return response.json();
};

export const deleteListing = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete listing');
  }
};

export const updateListingStatus = async (id: number, status: Listing['status']): Promise<Listing> => {
  const response = await fetch(`${API_URL}/listings/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update listing status');
  }
  return response.json();
};

export const getUserListings = async (): Promise<Listing[]> => {
  const response = await fetch(`${API_URL}/listings/user`);
  if (!response.ok) {
    throw new Error('Failed to fetch user listings');
  }
  return response.json();
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files[]', file);
  });

  const response = await fetch(`${API_URL}/listings/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload images');
  }
  const data = await response.json();
  return data.files;
};

export const requestToBuy = async (id: number, message: string, contactInfo: string): Promise<{ message: string; listing: Listing }> => {
  const response = await fetch(`${API_URL}/listings/${id}/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      contact_info: contactInfo,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to send purchase request');
  }
  return response.json();
};

export const getCategories = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/listings/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};
  