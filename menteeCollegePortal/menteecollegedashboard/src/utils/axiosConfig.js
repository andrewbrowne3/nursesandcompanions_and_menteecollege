import axios from 'axios';
import { store } from '../store';
import { logout } from '../actions/userActions';
import { isTokenExpired, getStoredToken, clearAuthData } from './tokenUtils';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.menteecollege.com',
  timeout: 30000,
});

// Request interceptor - validates token before every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from userInfo in localStorage (consistent with Redux store)
    const token = getStoredToken();

    if (token) {
      // Check if token is expired before making request
      if (isTokenExpired(token)) {
        console.log('Token expired - logging out user');

        // Clear authentication data
        clearAuthData();

        // Dispatch logout event for Redux to handle
        window.dispatchEvent(new CustomEvent('auth-token-expired'));

        // Redirect to login
        const currentPath = window.location.pathname;
        const redirectUrl = currentPath !== '/login' && currentPath !== '/'
          ? `/?redirect=${encodeURIComponent(currentPath)}`
          : '/';

        window.location.href = redirectUrl;

        // Cancel the request
        return Promise.reject(new Error('Token expired'));
      }

      // Token is valid, add to headers
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Check if we have a refresh token
      const state = store.getState();
      const userInfo = state.userLogin?.userInfo;
      const refreshToken = userInfo?.refresh;

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'https://api.menteecollege.com'}/api/users/token/refresh/`,
            { refresh: refreshToken }
          );

          // Update the token in localStorage and Redux store
          const newToken = response.data.access;
          const updatedUserInfo = { ...userInfo, access: newToken, token: newToken };

          // Update localStorage
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

          // Dispatch action to update Redux store
          store.dispatch({ type: 'userLogin/updateToken', payload: updatedUserInfo });

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          console.error('Token refresh failed:', refreshError);

          // Clear authentication data
          clearAuthData();

          // Dispatch logout action
          store.dispatch(logout());

          // Dispatch custom event for token expiration
          window.dispatchEvent(new CustomEvent('auth-token-expired'));

          // Redirect to login page
          const currentPath = window.location.pathname;
          const redirectUrl = currentPath !== '/login' && currentPath !== '/'
            ? `/?redirect=${encodeURIComponent(currentPath)}`
            : '/';

          window.location.href = redirectUrl;
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, logout user
        console.log('401 Unauthorized - no refresh token, logging out');

        // Clear authentication data
        clearAuthData();

        // Dispatch logout action
        store.dispatch(logout());

        // Dispatch custom event for token expiration
        window.dispatchEvent(new CustomEvent('auth-token-expired'));

        // Redirect to login
        const currentPath = window.location.pathname;
        const redirectUrl = currentPath !== '/login' && currentPath !== '/'
          ? `/?redirect=${encodeURIComponent(currentPath)}`
          : '/';

        window.location.href = redirectUrl;
      }
    }

    // For other errors, just return the error
    return Promise.reject(error);
  }
);

export default axiosInstance;