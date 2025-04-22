import { CAS_URL, FRONTEND_URL, API_URL } from '../config';
import axios from 'axios';

export interface UserInfo {
  netid: string;
  name?: string;
  email?: string;
}

// Simple login - redirect to CAS
export const login = () => {
  const serviceUrl = `${FRONTEND_URL}/auth/callback`;
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
};

// Simple logout - clear storage and redirect to home
export const logout = () => {
  localStorage.removeItem('netid');
  window.location.href = '/';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('netid');
};

// Get the current user's netid
export const getNetid = () => {
  return localStorage.getItem('netid');
};

// Store the user's netid
export const setNetid = (netid: string) => {
  localStorage.setItem('netid', netid);
};

// For backward compatibility - returns netid as the user ID
export const getUserId = () => {
  const netid = localStorage.getItem('netid');
  console.log('Getting user ID (netid):', netid);
  return netid;
};

// Initialize user in database
export const initializeUser = async () => {
  console.log('Starting user initialization');
  try {
    const netid = getNetid();
    if (!netid) {
      console.error('No netid found during initialization');
      // Redirect to login if no netid is found
      login();
      return;
    }

    console.log('Making request to initialize user');
    const response = await fetch(`${API_URL}/api/auth/users/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ netid }),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // If unauthorized, clear netid and redirect to login
        localStorage.removeItem('netid');
        login();
        return;
      }
      console.error('Failed to initialize user:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User initialized successfully:', data);
    return data;
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
};

export const setUserInfo = (userInfo: UserInfo) => {
  console.log('Setting user info:', userInfo);
  localStorage.setItem('netid', userInfo.netid);
};

export const getUserInfo = (): UserInfo | null => {
  const netid = localStorage.getItem('netid');
  console.log('Getting user info for netid:', netid);
  return netid ? { netid } : null;
};

export const validateTicket = async (ticket: string): Promise<UserInfo> => {
    try {
        const serviceUrl = `${FRONTEND_URL}/auth/callback`;
        console.log('Validating ticket with service URL:', serviceUrl);
        
        const response = await axios.get<{ netid: string }>(`${API_URL}/api/auth/validate`, {
            params: {
                ticket,
                service: serviceUrl
            },
            withCredentials: true // Important for session cookies
        });
        
        console.log('Validation response:', response.data);
        return { netid: response.data.netid };
    } catch (error) {
        console.error('Error validating ticket:', error);
        throw error;
    }
}; 