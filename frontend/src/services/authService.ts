import { API_URL, CAS_URL, FRONTEND_URL } from '../config';

export interface UserInfo {
  netid: string;
  user_id?: string;
}

export const login = () => {
  // Redirect to CAS login with backend callback URL
  const serviceUrl = `${API_URL}/api/auth/cas/login`;
  window.location.href = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
};

export const logout = () => {
  // Clear user info and redirect to login
  localStorage.removeItem('userInfo');
  window.location.href = '/login';
};

export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem('userInfo');
  return userInfoStr ? JSON.parse(userInfoStr) : null;
};

export const setUserInfo = (userInfo: UserInfo) => {
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

export const isAuthenticated = () => {
  return !!getUserInfo();
};

export const getNetid = () => {
  const userInfo = getUserInfo();
  return userInfo?.netid || null;
};

export const getUserId = () => {
  const userInfo = getUserInfo();
  return userInfo?.user_id || null;
}; 