import { API_URL } from '../config';

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData extends LoginData {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: number;
  username: string;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const result = await response.json();
  localStorage.setItem('token', result.access_token);
  localStorage.setItem('user_id', result.user_id.toString());
  localStorage.setItem('username', result.username);
  return result;
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

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
};

export const getToken = () => localStorage.getItem('token');
export const getUserId = () => localStorage.getItem('user_id');
export const getUsername = () => localStorage.getItem('username');
export const isAuthenticated = () => !!getToken(); 