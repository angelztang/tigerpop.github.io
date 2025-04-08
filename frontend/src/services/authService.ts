import axios from 'axios';
import { CAS_URL } from '../config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export const login = () => {
  // Check if we already have a token
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/';
    return;
  }

  // Get the current URL without any existing parameters
  const currentUrl = window.location.origin + window.location.pathname;
  const redirectUri = encodeURIComponent(currentUrl);
  const serviceUrl = `${API_URL}/auth/cas/login?redirect_uri=${redirectUri}`;
  
  // Redirect to CAS login, which will handle Duo Security
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
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

export const getToken = () => localStorage.getItem('token');

export const getUserId = () => localStorage.getItem('user_id');

export const getNetid = () => localStorage.getItem('netid');

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
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