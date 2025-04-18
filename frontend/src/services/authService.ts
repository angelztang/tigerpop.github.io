import { CAS_URL, FRONTEND_URL } from '../config';

const API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com';

export interface UserInfo {
  netid: string;
}

export const login = () => {
  console.log('Starting login process');
  // Redirect to CAS login with frontend callback URL
  const serviceUrl = `${FRONTEND_URL}/auth/callback`;
  console.log('Redirecting to CAS with service URL:', serviceUrl);
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const logout = () => {
  console.log('Starting logout process');
  // Clear netid and redirect to login
  localStorage.removeItem('netid');
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const getNetid = () => {
  const netid = localStorage.getItem('netid');
  console.log('Getting netid:', netid);
  return netid;
};

export const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('Getting token:', token ? 'Token exists' : 'No token');
  return token;
};

export const isAuthenticated = () => {
  const authenticated = !!localStorage.getItem('netid');
  console.log('Checking authentication:', authenticated);
  return authenticated;
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
      throw new Error('No netid found');
    }

    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('Making request to initialize user');
    const response = await fetch(`${API_URL}/api/auth/users/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ netid }),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
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