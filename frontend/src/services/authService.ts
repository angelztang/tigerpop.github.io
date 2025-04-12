import axios from 'axios';
import { CAS_URL, FRONTEND_URL } from '../config';

const API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com';

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: number;
  netid: string;
}

interface VerifyResponse {
  netid: string;
  user_id: number;
}

export const login = () => {
  // Check if we already have a token
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/';
    return;
  }

  // Redirect to CAS login with the correct service URL
  const serviceUrl = `${FRONTEND_URL}/auth/cas/login`;
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const handleCasCallback = (token: string): AuthResponse => {
  try {
    // Store the token
    localStorage.setItem('token', token);
    
    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    
    // Store user info
    localStorage.setItem('user_id', payload.sub);
    localStorage.setItem('netid', payload.netid);
    
    // Force a state update by dispatching a storage event
    window.dispatchEvent(new Event('storage'));
    
    return {
      access_token: token,
      user_id: payload.sub,
      netid: payload.netid
    };
  } catch (error) {
    console.error('Error processing token:', error);
    // Clear any partial data
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('netid');
    throw error;
  }
};

export const logout = () => {
  // Clear all stored data
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('netid');
  
  // Redirect to login page
  window.location.href = '/login';
};

export const getToken = () => localStorage.getItem('token');

export const getUserId = () => localStorage.getItem('user_id');

export const getNetid = () => localStorage.getItem('netid');

export const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // First check if token is expired locally
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    if (Date.now() >= expirationTime) {
      console.log('Token expired');
      return false;
    }

    // Then verify with backend
    const response = await axios.get<VerifyResponse>(`${API_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      // Update local storage with fresh data
      const { netid } = response.data;
      localStorage.setItem('netid', netid);
      return true;
    }
    
    // If verification fails but we have a valid token, try to use the stored netid
    const storedNetid = localStorage.getItem('netid');
    if (storedNetid) {
      console.log('Using stored netid from token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying token:', error);
    // Don't clear the token on verification failure
    // Only clear if we're sure it's invalid
    const storedNetid = localStorage.getItem('netid');
    if (storedNetid) {
      console.log('Using stored netid despite verification error');
      return true;
    }
    return false;
  }
};

export const signup = async (data: SignupData): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Signup failed');
  }

  return response.json();
}; 