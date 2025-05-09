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
  pricing_mode: 'fixed' | 'auction' | 'Fixed' | 'Auction' | 'FIXED' | 'AUCTION';
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
  pricing_mode: 'fixed' | 'auction' | 'Fixed' | 'Auction' | 'FIXED' | 'AUCTION';
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
    
    // Parse the filters string to handle multiple conditions
    let filterParams = '';
    if (filters) {
      const params = new URLSearchParams(filters.replace('?', ''));
      // Handle multiple conditions
      const conditions = params.getAll('condition');
      params.delete('condition');
      conditions.forEach(condition => {
        params.append('condition', condition);
      });
      filterParams = '&' + params.toString();
    }
    
    const url = `${baseUrl}${baseFilters}${filterParams}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure we have an array of listings
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array of listings');
    }
    
    // Filter out any listings that are not available
    const availableListings = data.filter(listing => listing.status === 'available');
    
    return availableListings;
  } catch (error) {
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
    
    // Log raw response
    const rawData = await response.json();
    
    // Type check and transform the data
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid response format: expected array of listings');
    }
    
    // Transform pricing_mode to match the expected format
    const data: Listing[] = rawData.map(listing => ({
      ...listing,
      pricing_mode: listing.pricing_mode?.toLowerCase() as Listing['pricing_mode']
    }));
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const requestToBuy = async (listingId: number, buyerId: number): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/api/listing/${listingId}/request`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ buyer_id: buyerId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
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
    const response = await fetch(`${API_URL}/api/listing/buyer?netid=${netid}`, {
      headers: getHeaders(),
      credentials: 'include',
      mode: 'cors'
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
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
  try {
    const response = await fetch(`${API_URL}/api/listings/${bidData.listing_id}/bids`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount: bidData.amount, bidder_id: bidData.bidder_id }),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      let errorMessage = 'Failed to place bid';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to place bid');
  }
};

export const getBids = async (listingId: number): Promise<Bid[]> => {
  const response = await fetch(`${API_URL}/api/listings/${listingId}/bids`, {
    headers: getHeaders(),
    credentials: 'include',
    mode: 'cors'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bids');
  }

  return response.json();
};

export const closeBidding = async (listingId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/listings/${listingId}/close-bidding`, {
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
  