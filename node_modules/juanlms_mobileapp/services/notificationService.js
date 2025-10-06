import { apiPost, apiRequest } from '../utils/apiUtils';

export const registerDeviceToken = async (userId, token, retryCount = 0) => {
  if (!userId || !token) return false;
  
  const maxRetries = 3;
  const retryDelay = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s, 3s
  
  try {
    await apiPost(`/api/users/${userId}/device-token`, { token });
    console.log(`Device token registered successfully for user ${userId} (attempt ${retryCount + 1})`);
    return true;
  } catch (error) {
    console.error(`Failed to register device token (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying device token registration in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return registerDeviceToken(userId, token, retryCount + 1);
    }
    
    console.error(`Device token registration failed after ${maxRetries + 1} attempts`);
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


