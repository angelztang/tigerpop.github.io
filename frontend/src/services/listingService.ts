// Handles fetching, creating, and updating listings (API calls)

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  user_id: number;
<<<<<<< HEAD
  created_at?: string;
  updated_at?: string;
  status: string;
=======
  created_at: string;
  images: string[];
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
<<<<<<< HEAD
  category?: string;
  image_urls?: string[];
  user_id?: number;
  images?: File[];
}

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

export const getListings = async (queryString: string = ''): Promise<Listing[]> => {
  try {
    // Always include sold items in the query
    const baseUrl = queryString.startsWith('/api') 
      ? `${API_URL}${queryString}` 
      : `${API_URL}/api/listings${queryString}`;
    
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}include_sold=true`;
    
    console.log('Fetching listings from:', url); // Debug log
    console.log('Current environment:', process.env.NODE_ENV); // Debug log
    console.log('API_URL:', API_URL); // Debug log
    
    const headers = {
      ...getAuthHeaders(),
      'Accept': 'application/json'
    };
    console.log('Request headers:', headers); // Debug log
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: headers,
      mode: 'cors' // Explicitly set CORS mode
    });
    
    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received listings:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    if (error instanceof TypeError) {
      console.error('Network error details:', {
        message: error.message,
        stack: error.stack,
        url: API_URL
      });
    }
    throw error;
  }
};

export const createListing = async (data: CreateListingData): Promise<Listing> => {
  try {
    // First, upload any images if they exist
    let image_urls: string[] = [];
    if (data.images && data.images.length > 0) {
      image_urls = await uploadImages(data.images);
    }

    // Create the listing with the image URLs
    const response = await fetch(`${API_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        image_urls
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create listing');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: number, data: Partial<CreateListingData>): Promise<Listing> => {
  try {
    const response = await fetch(`${API_URL}/api/listings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
=======
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
  const response = await axios.post<Listing>(`${API_URL}/api/listing`, data);
  return response.data;
};

export const updateListing = async (id: number, data: Partial<Listing>): Promise<Listing> => {
  const response = await axios.put<Listing>(`${API_URL}/api/listing/${id}`, data);
  return response.data;
};
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

export const updateListingStatus = async (id: number, status: 'available' | 'sold'): Promise<Listing> => {
  const response = await axios.patch<Listing>(`${API_URL}/api/listing/${id}/status`, { status });
  return response.data;
};

export const deleteListing = async (id: number): Promise<void> => {
<<<<<<< HEAD
  try {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      throw new Error('No authentication token found');
    }

    console.log('Deleting listing with ID:', id); // Debug log
    console.log('Using headers:', headers); // Debug log

    const response = await fetch(`${API_URL}/api/listings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: headers
    });

    console.log('Delete response status:', response.status); // Debug log
    console.log('Delete response headers:', Object.fromEntries(response.headers.entries())); // Debug log

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData?.message || `Failed to delete listing: ${response.status} ${response.statusText}`);
    }

    const result = await response.text();
    console.log('Delete successful:', result); // Debug log
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

export const updateListingStatus = async (id: number, status: string): Promise<void> => {
  try {
    console.log('Updating listing status:', { id, status }); // Debug log
    console.log('API URL:', API_URL); // Debug log

    const response = await fetch(`${API_URL}/api/listings/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`Failed to update listing status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Status update successful:', data); // Debug log
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
};

export const getUserListings = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_URL}/api/listings/user`, {
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
=======
  await axios.delete(`${API_URL}/api/listing/${id}`);
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    console.log('Starting image upload process...'); // Debug log
    console.log('Files to upload:', files.map(f => ({ name: f.name, type: f.type, size: f.size }))); // Debug log

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

<<<<<<< HEAD
    console.log('Making request to:', `${API_URL}/api/listings/upload`); // Debug log

    const response = await fetch(`${API_URL}/api/listings/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Add credentials
    });

    console.log('Upload response status:', response.status); // Debug log
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries())); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText); // Debug log
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || errorData.error || 'Failed to upload images');
      } catch (parseError) {
        throw new Error(`Failed to upload images: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Upload successful, received URLs:', data.urls); // Debug log
    return data.urls;
  } catch (error: any) { // Type error as any since we know it's an Error object
=======
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
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
    console.error('Error uploading images:', error);
    console.error('Error details:', {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      url: `${API_URL}/api/listings/upload`
    }); // Debug log
    throw error;
  }
};

export const purchaseListing = async (listingId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/listings/${listingId}/purchase`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to purchase listing');
    }

    // The backend will handle sending the email notification to the seller
    return response.json();
  } catch (error) {
    console.error('Error purchasing listing:', error);
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

export const requestToBuy = async (listingId: number, message: string, contactInfo: string): Promise<Listing> => {
  const response = await axios.post<Listing>(`${API_URL}/api/listings/${listingId}/request`, {
    message,
    contact_info: contactInfo,
  });
  return response.data;
};

export const getUserPurchases = async (): Promise<Listing[]> => {
  const response = await axios.get<Listing[]>(`${API_URL}/api/listing/purchases`);
  return response.data;
};
  