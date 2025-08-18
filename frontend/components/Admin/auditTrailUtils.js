import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

// Sends an audit log to the backend. Falls back to local storage if offline.
// Expected log: { action: string, details: string, userRole?: string }
export const addAuditLog = async (log) => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      const res = await fetch(`${API_BASE_URL}/audit-log`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: log.action,
          details: log.details,
          userRole: log.userRole,
        }),
      });

      if (!res.ok) {
        // If server rejects, store locally to avoid losing the event
        console.warn('Audit log POST failed, caching locally. Status:', res.status);
        await cacheAuditLogLocally(log);
      }
      return;
    }

    // No token yet; cache locally
    await cacheAuditLogLocally(log);
  } catch (e) {
    console.error('Failed to POST audit log, caching locally:', e);
    await cacheAuditLogLocally(log);
  }
};

async function cacheAuditLogLocally(log) {
  try {
    const logs = JSON.parse(await AsyncStorage.getItem('auditLogs')) || [];
    logs.push({ ...log, cachedAt: new Date().toISOString() });
    await AsyncStorage.setItem('auditLogs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to cache audit log locally:', e);
  }
}