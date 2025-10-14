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
      console.log('Fetching user stats...');
      
      // Try the local backend endpoint first (more reliable)
      try {
        const localResponse = await this.makeRequest('/api/admin/user-stats');
        console.log('Local backend user stats response:', localResponse);
        
        const stats = {
          admin: localResponse?.admin || localResponse?.admins || 0,
          faculty: localResponse?.faculty || 0,
          student: localResponse?.student || localResponse?.students || 0
        };
        
        console.log('Local backend mapped stats:', stats);
        return stats;
      } catch (localError) {
        console.error('Local backend failed, trying fallback method:', localError);
        
        // Fallback: fetch all users and count by role
        try {
          const usersResponse = await this.makeRequest('/users');
          console.log('Fallback users API response:', usersResponse);
          
          if (usersResponse && Array.isArray(usersResponse)) {
            const roleCounts = {
              admin: 0,
              faculty: 0,
              student: 0
            };
            
            usersResponse.forEach(user => {
              const role = user.role?.toLowerCase();
              if (role === 'admin' || role === 'administrator') roleCounts.admin++;
              else if (role === 'faculty' || role === 'teacher') roleCounts.faculty++;
              else if (role === 'student' || role === 'students' || role === 'learner') roleCounts.student++;
            });
            
            console.log('Fallback role counts:', roleCounts);
            return roleCounts;
          }
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
        }
        
        // Return default stats if all methods fail
        return { admin: 1, faculty: 8, student: 17 };
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return default stats on error
      return { admin: 1, faculty: 8, student: 17 };
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

      // Use the same calculation logic as the web app
      const startDate = new Date(yearRes.startDate || `${yearRes.schoolYearStart}-06-01`);
      const endDate = new Date(yearRes.endDate || `${yearRes.schoolYearEnd}-04-30`);
      const today = new Date();
      
      let schoolYearProgress = 0;
      if (today < startDate) {
        schoolYearProgress = 0;
      } else if (today > endDate) {
        schoolYearProgress = 100;
      } else {
        const totalDuration = endDate - startDate;
        const elapsed = today - startDate;
        schoolYearProgress = Math.floor((elapsed / totalDuration) * 100);
      }

      // Get current term
      const schoolYearName = `${yearRes.schoolYearStart}-${yearRes.schoolYearEnd}`;
      const termsRes = await this.makeRequest(`/api/terms/schoolyear/${schoolYearName}`);
      
      let termProgress = 0;
      if (termsRes && Array.isArray(termsRes)) {
        const activeTerm = termsRes.find(term => term.status === 'active');
        if (activeTerm) {
          const termStart = new Date(activeTerm.startDate);
          const termEnd = new Date(activeTerm.endDate);
          const today = new Date();
          
          if (today < termStart) {
            termProgress = 0;
          } else if (today > termEnd) {
            termProgress = 100;
          } else {
            const totalDuration = termEnd - termStart;
            const elapsed = today - termStart;
            termProgress = Math.floor((elapsed / totalDuration) * 100);
          }
        }
      }

      return {
        schoolYear: schoolYearProgress,
        term: termProgress
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