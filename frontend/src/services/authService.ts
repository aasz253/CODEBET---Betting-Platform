import axios from 'axios';

const API_URL = '/api/auth';

export interface RegisterData {
  phoneNumber: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    phoneNumber: string;
    fullName: string;
    isVerified: boolean;
    isAgeVerified: boolean;
    role: string;
  };
  token: string;
}

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('codebet_token');
  localStorage.removeItem('codebet_user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('codebet_user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export const getToken = () => {
  return localStorage.getItem('codebet_token');
};

export const setAuthData = (token: string, user: any) => {
  localStorage.setItem('codebet_token', token);
  localStorage.setItem('codebet_user', JSON.stringify(user));
};

axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
