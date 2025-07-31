import AsyncStorage from '@react-native-async-storage/async-storage';

export const addAuditLog = async (log) => {
  try {
    const logs = JSON.parse(await AsyncStorage.getItem('auditLogs')) || [];
    logs.push(log);
    await AsyncStorage.setItem('auditLogs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to add audit log:', e);
  }
}; 