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
  username: string;
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
  
  // Get username from additional claims
  const username = payload.username;
  localStorage.setItem('username', username);
  
  return {
    access_token: token,
    user_id: payload.sub,
    username: username
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  window.location.href = '/';
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUserId = () => localStorage.getItem('user_id');
export const getUsername = () => localStorage.getItem('username');
export const isAuthenticated = () => {
  return !!getToken();
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