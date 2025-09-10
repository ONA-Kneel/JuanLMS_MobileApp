import AsyncStorage from '@react-native-async-storage/async-storage';

let ExpoConstants = null;
try {
  // Avoid hard dependency if expo-constants isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require('expo-constants')?.default || null;
} catch {}

export const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

export const getApiBaseUrl = () => {
  try {
    const fromConfig = ExpoConstants?.expoConfig?.extra?.API_URL;
    return fromConfig || API_BASE_URL;
  } catch (e) {
    return API_BASE_URL;
  }
};

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
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
    ...(await getAuthHeaders()),
  };

  const makeFetch = async (fullUrl) => {
    const response = await fetch(fullUrl, {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    });
    return response;
  };

  const url = `${getApiBaseUrl()}${endpoint}`;

  try {
    let response = await makeFetch(url);

    // If 404 and caller used /api prefix, retry without it for compatibility
    if (response.status === 404 && endpoint.startsWith('/api/')) {
      const fallbackEndpoint = endpoint.replace('/api/', '/');
      const fallbackUrl = `${getApiBaseUrl()}${fallbackEndpoint}`;
      console.warn(`API ${method} ${url} returned 404. Retrying as ${fallbackUrl}`);
      response = await makeFetch(fallbackUrl);
    }

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = null;
      }
      const error = new Error(`HTTP error! status: ${response.status}`);
      // @ts-ignore attach context
      error.status = response.status;
      // @ts-ignore
      error.urlTried = url;
      // @ts-ignore
      error.responseBody = errorBody;
      console.error(`API ${method} ${url} failed with ${response.status}`, errorBody || '');
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API ${method} ${url} request failed:`, error);
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

export const apiPatch = (endpoint, data = null, customHeaders = {}) =>
  apiRequest('PATCH', endpoint, data, customHeaders);

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
