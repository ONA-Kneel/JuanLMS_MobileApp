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
      
      // Get JWT token for authorization
      const token = await AsyncStorage.getItem('jwtToken');
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

     // Get user statistics (matches web app /user-counts endpoint)
   async getUserStats() {
     try {
       const response = await this.makeRequest('/user-counts');
       // Ensure all role counts are included with fallbacks
       return {
         admin: response?.admin || 0,
         faculty: response?.faculty || 0,
         student: response?.student || 0,
         vpe: response?.vpe || 0,
         principal: response?.principal || 0
       };
     } catch (error) {
       console.error('Error fetching user stats:', error);
       // Return default values if API fails
       return { admin: 0, faculty: 0, student: 0, vpe: 0, principal: 0 };
     }
   }

     // Get recent login history from audit logs
   async getRecentLogins(limit = 10) {
     try {
       const response = await this.makeRequest(`/audit-logs?page=1&limit=${limit}&action=Login`);
       if (response && response.logs) {
         // Transform the data to only include userName and role
         return response.logs.map(log => ({
           userName: log.userName || 'Unknown User',
           role: log.userRole || 'Unknown Role'
         }));
       }
       return [];
     } catch (error) {
       console.error('Error fetching recent logins:', error);
       return [];
     }
   }

  // Get audit trail preview (matches web app /audit-logs endpoint)
  async getAuditPreview(limit = 10) {
    return this.makeRequest(`/audit-logs?page=1&limit=${limit}`);
  }

  // Get active users today from audit logs
  async getActiveUsersToday() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Filter audit logs for today's logins
    const logs = await this.makeRequest(`/audit-logs?page=1&limit=100&action=Login`);
    if (logs && logs.logs) {
      const todayLogins = logs.logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfDay && logDate <= endOfDay;
      });
      return todayLogins.length;
    }
    return 0;
  }

  // Get academic progress (calculate based on current date and academic calendar)
  async getAcademicProgress() {
    try {
      // Get current academic year and term
      const yearRes = await this.makeRequest('/api/schoolyears/active');
      if (!yearRes) return { schoolYear: 0, term: 0 };

      const schoolYearStart = new Date(yearRes.schoolYearStart);
      const schoolYearEnd = new Date(yearRes.schoolYearEnd);
      const now = new Date();

      // Calculate school year progress
      const schoolYearTotal = schoolYearEnd - schoolYearStart;
      const schoolYearElapsed = Math.max(0, now - schoolYearStart);
      const schoolYearProgress = Math.min(100, (schoolYearElapsed / schoolYearTotal) * 100);

      // Get current term
      const schoolYearName = `${yearRes.schoolYearStart}-${yearRes.schoolYearEnd}`;
      const termsRes = await this.makeRequest(`/api/terms/schoolyear/${schoolYearName}`);
      
      let termProgress = 0;
      if (termsRes && Array.isArray(termsRes)) {
        const activeTerm = termsRes.find(term => term.status === 'active');
        if (activeTerm) {
          const termStart = new Date(activeTerm.startDate);
          const termEnd = new Date(activeTerm.endDate);
          const termTotal = termEnd - termStart;
          const termElapsed = Math.max(0, now - termStart);
          termProgress = Math.min(100, (termElapsed / termTotal) * 100);
        }
      }

      return {
        schoolYear: Math.round(schoolYearProgress),
        term: Math.round(termProgress)
      };
    } catch (error) {
      console.error('Error fetching academic progress:', error);
      return { schoolYear: 0, term: 0 };
    }
  }

  // Get academic calendar events
  async getAcademicCalendar(month, year) {
    try {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month);
      if (year !== undefined) params.append('year', year);
      
      // Get class dates and events
      const classDates = await this.makeRequest('/api/class-dates');
      const events = await this.makeRequest('/events');
      
      // Get holidays from external API
      const holidaysRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year || new Date().getFullYear()}/PH`);
      const holidays = await holidaysRes.json();
      
      return {
        classDates: classDates || [],
        events: events || [],
        holidays: holidays || []
      };
    } catch (error) {
      console.error('Error fetching academic calendar:', error);
      return { classDates: [], events: [], holidays: [] };
    }
  }

  // Create audit log entry
  async createAuditLog(auditData) {
    return this.makeRequest('/audit-log', {
      method: 'POST',
      body: JSON.stringify(auditData),
    });
  }

  // Get dashboard summary (combines multiple endpoints like web app)
  async getDashboardSummary() {
    try {
      const [userStats, recentLogins, auditPreview, activeUsers, academicProgress] = await Promise.all([
        this.getUserStats(),
        this.getRecentLogins(5),
        this.getAuditPreview(5),
        this.getActiveUsersToday(),
        this.getAcademicProgress()
      ]);

             return {
         userStats,
         recentLogins: recentLogins || [],
         auditPreview: auditPreview?.logs || [],
         activeUsers,
         academicProgress
       };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
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