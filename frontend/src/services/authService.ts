import { API_URL } from '../config';

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
  netid: string;
}

export const login = () => {
  // Check if we already have a token
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/dashboard';
    return;
  }

  // Construct the final redirect URL (where we want to end up after CAS)
  const finalRedirectUrl = `${window.location.origin}/dashboard`;
  
  // Construct the service URL for CAS (our backend endpoint that will handle the ticket)
  const serviceUrl = `${API_URL}/api/auth/cas/login?redirect_uri=${encodeURIComponent(finalRedirectUrl)}`;
  
  // Redirect to CAS login with our service URL
  window.location.href = `https://fed.princeton.edu/cas/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const handleCasCallback = (token: string): AuthResponse => {
  // Store the token
  localStorage.setItem('token', token);
  
  // Decode the JWT token to get user info
  const payload = JSON.parse(atob(token.split('.')[1]));
  localStorage.setItem('user_id', payload.sub);
  localStorage.setItem('username', payload.username);
  localStorage.setItem('netid', payload.netid);
  
  return {
    access_token: token,
    user_id: payload.sub,
    username: payload.username,
    netid: payload.netid
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('netid');
  window.location.href = `${API_URL}/api/auth/cas/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
};

export const getToken = () => localStorage.getItem('token');
export const getUserId = () => localStorage.getItem('user_id');
export const getUsername = () => localStorage.getItem('username');
export const getNetId = () => localStorage.getItem('netid');
export const isAuthenticated = () => !!getToken();

export const signup = async (data: SignupData): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Signup failed');
  }

  return response.json();
}; 