import { CAS_URL, FRONTEND_URL } from '../config';

const API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com';

export interface UserInfo {
  netid: string;
}

export const login = () => {
  // Redirect to CAS login with frontend callback URL
  const serviceUrl = `${FRONTEND_URL}/auth/callback`;
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const logout = () => {
  // Clear netid and redirect to login
  localStorage.removeItem('netid');
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const getNetid = () => localStorage.getItem('netid');

export const getToken = () => localStorage.getItem('token');

export const isAuthenticated = () => {
  return !!localStorage.getItem('netid');
};

// For backward compatibility - returns netid as the user ID
export const getUserId = () => localStorage.getItem('netid');

// Initialize user in database
export const initializeUser = async () => {
  try {
    const netid = getNetid();
    if (!netid) {
      throw new Error('No netid found');
    }

    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/auth/users/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ netid }),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User initialized:', data);
    return data;
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
}; 