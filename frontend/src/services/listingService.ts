// Handles fetching, creating, and updating listings (API calls)

import { getUserId, getNetid, getUserInfo } from './authService';

const API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com';

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to get request headers
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  const token = localStorage.getItem('access_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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
  hearts_count?: number;
  pricing_mode: 'fixed' | 'auction';
  starting_price?: number;
  current_bid?: number;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  netid: string;
  condition: string;
  images?: string[];
  pricing_mode: 'fixed' | 'auction';
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
  try {
    const baseUrl = `${API_URL}/api/listing/`;
    // Always include status=available
    const baseFilters = '?status=available';
    const url = filters ? `${baseUrl}${baseFilters}${filters.replace('?', '&')}` : `${baseUrl}${baseFilters}`;
    console.log('Fetching listings from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw response data:', data);
    
    // Ensure we have an array of listings
    if (!Array.isArray(data)) {
      console.error('Expected array of listings, got:', data);
      throw new Error('Invalid response format: expected array of listings');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getListings:', error);
    throw error;
  }
};

export const getListing = async (id: number): Promise<Listing> => {
  const response = await fetch(`${API_URL}/api/listing/${id}`, {
    headers: getHeaders(),
    credentials: 'include',
    mode: 'cors'
  });
  return handleResponse(response);
};

export const createListing = async (listingData: CreateListingData): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listing`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(listingData),
      credentials: 'include',
      mode: 'cors'
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating listing:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update listing');
  }
};

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // Refresh the page after successful status update
    window.location.reload();
    return data;
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update listing status');
  }
};

export const deleteListing = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    // For 204 No Content responses, we don't need to parse the response
    if (response.status === 204) {
      // Refresh the page after successful deletion
      window.location.reload();
      return;
    }
    
    // For other successful responses, handle them normally
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete listing');
  }
};

interface UploadResponse {
  urls: string[];
}

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const headers = getHeaders();
    delete headers['Content-Type']; // Let the browser set the correct content type for FormData

    const response = await fetch(`${API_URL}/api/listing/upload/`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
      mode: 'cors'
    });
    
    const data = await handleResponse<UploadResponse>(response);
    if (!data.urls || !Array.isArray(data.urls)) {
      throw new Error('Invalid response format from server');
    }

    return data.urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/api/listing/categories/`, {
    headers: getHeaders(),
    credentials: 'include',
    mode: 'cors'
  });
  return handleResponse(response);
};

export const getUserListings = async (userId: string): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/user?netid=${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse<Listing[]>(response);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    throw error;
  }
};

export const requestToBuy = async (listingId: number): Promise<any> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const response = await fetch(`${API_URL}/api/listing/${listingId}/buy/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        buyer_id: userId,
        message: 'I am interested in this item',
        contact_info: 'Please contact me via email'
      }),
      credentials: 'include',
      mode: 'cors'
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  const response = await fetch(`${API_URL}/api/listing/purchases/`, {
    headers: getHeaders(),
    credentials: 'include',
    mode: 'cors'
  });
  return handleResponse(response);
};

export const getBuyerListings = async (netid: string): Promise<Listing[]> => {
  try {
    console.log('Fetching buyer listings for netid:', netid);
    const response = await fetch(`${API_URL}/api/listing/buyer?netid=${netid}`, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching buyer listings:', errorData);
      throw new Error(errorData.error || 'Failed to fetch buyer listings');
    }
    
    const data = await response.json();
    console.log('Received buyer listings:', data);
    return data;
  } catch (error) {
    console.error('Error in getBuyerListings:', error);
    throw error;
  }
};

export const heartListing = async (id: number): Promise<void> => {
  try {
    const netid = getNetid();
    if (!netid) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_URL}/api/listing/${id}/heart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ netid }),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error hearting listing:', error);
    throw error;
  }
};

export const unheartListing = async (id: number): Promise<void> => {
  try {
    const netid = getNetid();
    if (!netid) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_URL}/api/listing/${id}/heart`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ netid }),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error unhearting listing:', error);
    throw error;
  }
};

export const getHeartedListings = async (): Promise<Listing[]> => {
  try {
    const netid = getNetid();
    if (!netid) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_URL}/api/listing/hearted/?netid=${netid}`, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array of listings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hearted listings:', error);
    throw error;
  }
};

export const getHotItems = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/hot`, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array of listings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hot items:', error);
    throw error;
  }
};

export interface Bid {
  id: number;
  listing_id: number;
  bidder_id: number;
  amount: number;
  timestamp: string;
}

export interface CreateBidData {
  listing_id: number;
  bidder_id: number;
  amount: number;
}

export const placeBid = async (bidData: CreateBidData): Promise<Bid> => {
  const response = await fetch(`${API_URL}/api/listing/${bidData.listing_id}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bidData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place bid');
  }

  return response.json();
};

export const getBids = async (listingId: number): Promise<Bid[]> => {
  const response = await fetch(`${API_URL}/api/listing/${listingId}/bids`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bids');
  }

  return response.json();
};

export const closeBidding = async (listingId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/listing/${listingId}/close-bidding`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    mode: 'cors'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to close bidding');
  }
};
  