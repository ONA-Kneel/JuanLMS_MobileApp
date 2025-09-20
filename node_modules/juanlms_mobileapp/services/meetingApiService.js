import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

class MeetingApiService {
  // Get authentication token
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw error;
    }
  }

  // Create a new meeting
  async createMeeting(meetingData) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create meeting');
      }

      return result;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Get meetings for a specific class
  async getClassMeetings(classId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch meetings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching class meetings:', error);
      throw error;
    }
  }

  // Get direct invitation meetings
  async getDirectInviteMeetings() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/direct-invite`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch direct invite meetings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching direct invite meetings:', error);
      throw error;
    }
  }

  // Get meetings where current user is invited
  async getInvitedMeetings() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/invited`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch invited meetings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching invited meetings:', error);
      throw error;
    }
  }

  // Join a meeting
  async joinMeeting(meetingId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to join meeting');
      }

      return result;
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  // Leave a meeting
  async leaveMeeting(meetingId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to leave meeting');
      }

      return result;
    } catch (error) {
      console.error('Error leaving meeting:', error);
      throw error;
    }
  }

  // Delete a meeting
  async deleteMeeting(meetingId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete meeting');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  // Update meeting status
  async updateMeetingStatus(meetingId, status) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update meeting status');
      }

      return result;
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }

  // Get meeting participants
  async getMeetingParticipants(meetingId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch meeting participants');
      }

      return result;
    } catch (error) {
      console.error('Error fetching meeting participants:', error);
      throw error;
    }
  }

  // Create direct invitation meeting
  async createDirectInviteMeeting(meetingData) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/direct-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create direct invitation meeting');
      }

      return result;
    } catch (error) {
      console.error('Error creating direct invitation meeting:', error);
      throw error;
    }
  }

  // Get user's classes for meeting creation
  async getUserClasses() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/classes/my-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch classes');
      }

      // Handle different response formats
      let classes = [];
      if (Array.isArray(result)) {
        classes = result;
      } else if (result.success && Array.isArray(result.classes)) {
        classes = result.classes;
      }

      return classes;
    } catch (error) {
      console.error('Error fetching user classes:', error);
      throw error;
    }
  }

  // Get all users for direct invitations
  async getAllUsers() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      return result;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Sync meeting data with web app
  async syncMeetingData(meetingId, data) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/meetings/${meetingId}/sync`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to sync meeting data');
      }

      return result;
    } catch (error) {
      console.error('Error syncing meeting data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MeetingApiService();
