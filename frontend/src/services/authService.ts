import axios from 'axios';
import { API_URL, CAS_URL } from '../config';

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

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = () => {
  // Check if we already have a token
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/';
    return;
  }

  // Store the current URL as the return URL in localStorage
  const returnUrl = window.location.origin + window.location.pathname;
  localStorage.setItem('returnUrl', returnUrl);

  // Redirect directly to the backend's CAS login endpoint
  window.location.href = `${API_URL}/api/auth/cas/login?redirect_uri=${encodeURIComponent(returnUrl)}`;
};

export const handleCasCallback = (token: string): AuthResponse => {
  // Store the token
  localStorage.setItem('token', token);
  
  // Decode the JWT token to get user info
  const payload = JSON.parse(atob(token.split('.')[1]));
  localStorage.setItem('user_id', payload.sub);
  
  // Get netid from additional claims
  const netid = payload.netid;
  localStorage.setItem('netid', netid);
  
  return {
    access_token: token,
    user_id: payload.sub,
    netid: netid
  };
};

export const logout = () => {
  // Clear all stored data
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('netid');
  
  // Redirect to login page
  window.location.href = '/login';
};

export const getUserId = (): string | null => localStorage.getItem('user_id');

export const getNetid = (): string | null => localStorage.getItem('netid');

export const isAuthenticated = (): boolean => {
  const netid = getNetid();
  return !!netid;
};

export const signup = async (data: SignupData): Promise<{ message: string }> => {
  const response = await api.post('/api/signup', data);
  return response.data as { message: string };
}; 