import AsyncStorage from '@react-native-async-storage/async-storage';

class MeetingSyncService {
  constructor() {
    this.baseURL = 'https://juanlms-webapp-server.onrender.com';
    this.syncInterval = null;
    this.isSyncing = false;
  }

  // Start real-time synchronization
  startSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      this.syncMeetings();
    }, 5000); // Sync every 5 seconds
  }

  // Stop synchronization
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync meetings with backend
  async syncMeetings() {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        console.log('No auth token found, skipping sync');
        return;
      }

      // Get all meetings
      const response = await fetch(`${this.baseURL}/api/meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const meetings = await response.json();
        await this.updateLocalMeetings(meetings);
        console.log('Meetings synced successfully');
      } else {
        console.error('Failed to sync meetings:', response.status);
      }
    } catch (error) {
      console.error('Error syncing meetings:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Update local meetings cache
  async updateLocalMeetings(meetings) {
    try {
      await AsyncStorage.setItem('cachedMeetings', JSON.stringify(meetings));
    } catch (error) {
      console.error('Error caching meetings:', error);
    }
  }

  // Get cached meetings
  async getCachedMeetings() {
    try {
      const cached = await AsyncStorage.getItem('cachedMeetings');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached meetings:', error);
      return [];
    }
  }

  // Join meeting with cross-platform support
  async joinMeeting(meetingId, userInfo) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update meeting status to ongoing
        await this.updateMeetingStatus(meetingId, 'ongoing');
        
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  // Leave meeting
  async leaveMeeting(meetingId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update meeting status
        await this.updateMeetingStatus(meetingId, 'scheduled');
        return true;
      } else {
        console.error('Failed to leave meeting:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error leaving meeting:', error);
      return false;
    }
  }

  // Update meeting status
  async updateMeetingStatus(meetingId, status) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      await fetch(`${this.baseURL}/api/meetings/${meetingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error updating meeting status:', error);
    }
  }

  // Get meeting status
  async getMeetingStatus(meetingId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to get meeting status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error getting meeting status:', error);
      return null;
    }
  }

  // Start recording
  async startRecording(meetingId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}/start-recording`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Recording started:', result.recordingId);
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording
  async stopRecording(meetingId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}/stop-recording`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Recording stopped');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop recording');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  // Create meeting
  async createMeeting(meetingData) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...meetingData,
          platform: Platform.OS,
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Meeting created:', result._id);
        
        // Sync meetings after creating
        await this.syncMeetings();
        
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Delete meeting
  async deleteMeeting(meetingId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Meeting deleted:', meetingId);
        
        // Sync meetings after deleting
        await this.syncMeetings();
        
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  // Get meetings for a specific class
  async getClassMeetings(classId) {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${this.baseURL}/api/meetings/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to get class meetings:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error getting class meetings:', error);
      return [];
    }
  }

  // Check if meeting is active
  async isMeetingActive(meetingId) {
    try {
      const status = await this.getMeetingStatus(meetingId);
      return status && status.isCurrentlyActive;
    } catch (error) {
      console.error('Error checking meeting status:', error);
      return false;
    }
  }

  // Get active participants count
  async getActiveParticipantsCount(meetingId) {
    try {
      const status = await this.getMeetingStatus(meetingId);
      return status ? status.participantCount : 0;
    } catch (error) {
      console.error('Error getting participants count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new MeetingSyncService();
