import { CAS_URL, FRONTEND_URL } from '../config';

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
  window.location.href = '/login';
};

export const getNetid = () => localStorage.getItem('netid');

export const isAuthenticated = () => {
  return !!localStorage.getItem('netid');
};

// For backward compatibility - returns netid as the user ID
export const getUserId = () => localStorage.getItem('netid'); 