import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

// Get JWT token from AsyncStorage
export const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
};

// API request wrapper with automatic JWT headers
export const apiRequest = async (method, endpoint, data = null, customHeaders = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
      ...(await getAuthHeaders()),
    };

    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      ...(data && { data }),
    };

    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API ${method} request failed:`, error);
    throw error;
  }
};

// Convenience methods for different HTTP methods
export const apiGet = (endpoint, customHeaders = {}) => 
  apiRequest('GET', endpoint, null, customHeaders);

export const apiPost = (endpoint, data, customHeaders = {}) => 
  apiRequest('POST', endpoint, data, customHeaders);

export const apiPut = (endpoint, data, customHeaders = {}) => 
  apiRequest('PUT', endpoint, data, customHeaders);

export const apiDelete = (endpoint, customHeaders = {}) => 
  apiRequest('DELETE', endpoint, null, customHeaders);

// Axios wrapper with automatic JWT headers
export const axiosWithAuth = async (axiosInstance, method, url, data = null, customHeaders = {}) => {
  try {
    const headers = {
      ...customHeaders,
      ...(await getAuthHeaders()),
    };

    const config = {
      method,
      url,
      headers,
      ...(data && { data }),
    };

    const response = await axiosInstance(config);
    return response;
  } catch (error) {
    console.error(`Axios ${method} request failed:`, error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Logout helper
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('jwtToken');
    await AsyncStorage.removeItem('userData');
    // Add any other cleanup needed
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Handle API errors consistently
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || defaultMessage;
    
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return 'Invalid data provided.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    return error.message || defaultMessage;
  }
};
