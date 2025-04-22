import axios from 'axios';
import { API_URL } from '../config';

interface UserInfo {
  netid: string;
  user_id?: number;
  access_token?: string;
}

export const setNetid = (netid: string) => {
  localStorage.setItem('netid', netid);
};

export const getNetid = (): string | null => {
  return localStorage.getItem('netid');
};

export const setToken = (token: string) => {
  localStorage.setItem('access_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const clearAuth = () => {
  localStorage.removeItem('netid');
  localStorage.removeItem('access_token');
};

export const login = () => {
  // Redirect to CAS login
  const serviceUrl = `${window.location.origin}/auth/callback`;
  window.location.href = `${API_URL}/api/auth/cas/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const logout = () => {
  clearAuth();
  window.location.href = `${API_URL}/api/auth/cas/logout`;
};

export const validateTicket = async (ticket: string): Promise<UserInfo> => {
  try {
    const serviceUrl = `${window.location.origin}/auth/callback`;
    const response = await axios.get<UserInfo>(`${API_URL}/api/auth/validate`, {
      params: {
        ticket,
        service: serviceUrl
      }
    });
    
    if (response.data.netid) {
      setNetid(response.data.netid);
      if (response.data.access_token) {
        setToken(response.data.access_token);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to validate ticket:', error);
    throw error;
  }
};

export const checkUser = async (): Promise<UserInfo> => {
  try {
    const netid = getNetid();
    if (!netid) {
      throw new Error('No netid found');
    }

    const response = await axios.post<UserInfo>(`${API_URL}/api/auth/users/check`, {
      netid
    }, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (response.data.access_token) {
      setToken(response.data.access_token);
    }

    return response.data;
  } catch (error) {
    console.error('Failed to check user:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('netid');
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