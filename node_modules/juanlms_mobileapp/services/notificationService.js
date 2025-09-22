import { apiPost, apiRequest } from '../utils/apiUtils';

export const registerDeviceToken = async (userId, token) => {
  if (!userId || !token) return false;
  try {
    await apiPost(`/api/users/${userId}/device-token`, { token });
    return true;
  } catch (error) {
    console.error('Failed to register device token:', error);
    return false;
  }
};

export const removeDeviceToken = async (userId, token) => {
  if (!userId || !token) return false;
  try {
    await apiRequest('DELETE', `/api/users/${userId}/device-token`, { token });
    return true;
  } catch (error) {
    console.error('Failed to remove device token:', error);
    return false;
  }
};


