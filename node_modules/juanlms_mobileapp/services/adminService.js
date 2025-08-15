import AsyncStorage from '@react-native-async-storage/async-storage';

class AdminService {
  constructor() {
    this.baseURL = null;
  }

  async getBaseURL() {
    if (!this.baseURL) {
      this.baseURL = await AsyncStorage.getItem('baseURL') || 'https://juanlms-webapp-server.onrender.com';
    }
    return this.baseURL;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const baseURL = await this.getBaseURL();
      const url = `${baseURL}${endpoint}`;
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get dashboard summary (all data in one call)
  async getDashboardSummary() {
    return this.makeRequest('/api/admin/dashboard-summary');
  }

  // Get user statistics
  async getUserStats() {
    return this.makeRequest('/api/admin/user-stats');
  }

  // Get recent login history
  async getRecentLogins(limit = 10) {
    return this.makeRequest(`/api/admin/recent-logins?limit=${limit}`);
  }

  // Get audit trail preview
  async getAuditPreview(limit = 10) {
    return this.makeRequest(`/api/admin/audit-preview?limit=${limit}`);
  }

  // Get active users today
  async getActiveUsersToday() {
    return this.makeRequest('/api/admin/active-users-today');
  }

  // Get academic progress
  async getAcademicProgress() {
    return this.makeRequest('/api/admin/academic-progress');
  }

  // Get academic calendar events
  async getAcademicCalendar(month, year) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month);
    if (year !== undefined) params.append('year', year);
    
    return this.makeRequest(`/api/admin/academic-calendar?${params.toString()}`);
  }

  // Create audit log entry
  async createAuditLog(auditData) {
    return this.makeRequest('/api/admin/audit-log', {
      method: 'POST',
      body: JSON.stringify(auditData),
    });
  }

  // Refresh dashboard data
  async refreshDashboard() {
    try {
      const data = await this.getDashboardSummary();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new AdminService(); 