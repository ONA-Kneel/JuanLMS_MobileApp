import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import classSocketService from '../services/classSocketService';
import { useUser } from '../UserContext';

export default function ClassSocketTest() {
  const { user } = useUser();
  const [socketStatus, setSocketStatus] = useState('Not initialized');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [currentClassId, setCurrentClassId] = useState(null);
  const [events, setEvents] = useState([]);
  const [testClassId, setTestClassId] = useState('test-class-123');

  useEffect(() => {
    if (user?._id) {
      testSocketConnection();
    }
  }, [user?._id]);

  const testSocketConnection = async () => {
    try {
      setSocketStatus('Initializing...');
      const socket = await classSocketService.initialize(user._id);
      
      if (socket) {
        setSocketStatus('Initialized');
        setConnectionStatus(classSocketService.isSocketConnected() ? 'Connected' : 'Disconnected');
        
        // Set up event listeners for testing
        setupTestListeners();
        
        // Test connection
        classSocketService.testConnection();
      } else {
        setSocketStatus('Failed to initialize');
      }
    } catch (error) {
      console.error('Socket test error:', error);
      setSocketStatus('Error: ' + error.message);
    }
  };

  const setupTestListeners = () => {
    // Test response listener
    classSocketService.addEventListener('testResponse', (data) => {
      addEvent('Test Response', JSON.stringify(data));
    });

    // Assignment events
    classSocketService.addEventListener('newAssignment', (data) => {
      addEvent('New Assignment', JSON.stringify(data));
    });

    classSocketService.addEventListener('assignmentUpdated', (data) => {
      addEvent('Assignment Updated', JSON.stringify(data));
    });

    classSocketService.addEventListener('assignmentDeleted', (data) => {
      addEvent('Assignment Deleted', JSON.stringify(data));
    });

    // Announcement events
    classSocketService.addEventListener('newAnnouncement', (data) => {
      addEvent('New Announcement', JSON.stringify(data));
    });

    classSocketService.addEventListener('announcementUpdated', (data) => {
      addEvent('Announcement Updated', JSON.stringify(data));
    });

    classSocketService.addEventListener('announcementDeleted', (data) => {
      addEvent('Announcement Deleted', JSON.stringify(data));
    });

    // Quiz events
    classSocketService.addEventListener('newQuiz', (data) => {
      addEvent('New Quiz', JSON.stringify(data));
    });

    classSocketService.addEventListener('quizUpdated', (data) => {
      addEvent('Quiz Updated', JSON.stringify(data));
    });

    classSocketService.addEventListener('quizDeleted', (data) => {
      addEvent('Quiz Deleted', JSON.stringify(data));
    });

    // Lesson events
    classSocketService.addEventListener('newLesson', (data) => {
      addEvent('New Lesson', JSON.stringify(data));
    });

    classSocketService.addEventListener('lessonUpdated', (data) => {
      addEvent('Lesson Updated', JSON.stringify(data));
    });

    classSocketService.addEventListener('lessonDeleted', (data) => {
      addEvent('Lesson Deleted', JSON.stringify(data));
    });

    // Grade events
    classSocketService.addEventListener('gradePosted', (data) => {
      addEvent('Grade Posted', JSON.stringify(data));
    });

    classSocketService.addEventListener('gradeUpdated', (data) => {
      addEvent('Grade Updated', JSON.stringify(data));
    });

    // Notification events
    classSocketService.addEventListener('newNotification', (data) => {
      addEvent('New Notification', JSON.stringify(data));
    });
  };

  const addEvent = (type, data) => {
    const event = {
      id: Date.now(),
      type,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setEvents(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events
  };

  const joinTestClass = () => {
    if (classSocketService.isSocketConnected()) {
      classSocketService.joinClass(testClassId);
      setCurrentClassId(testClassId);
      addEvent('Join Class', `Joined class: ${testClassId}`);
    } else {
      Alert.alert('Error', 'Socket not connected');
    }
  };

  const leaveTestClass = () => {
    if (classSocketService.isSocketConnected() && currentClassId) {
      classSocketService.leaveClass(currentClassId);
      addEvent('Leave Class', `Left class: ${currentClassId}`);
      setCurrentClassId(null);
    } else {
      Alert.alert('Error', 'Not in any class or socket not connected');
    }
  };

  const testConnection = () => {
    if (classSocketService.isSocketConnected()) {
      classSocketService.testConnection();
      addEvent('Test Connection', 'Sent test message');
    } else {
      Alert.alert('Error', 'Socket not connected');
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const cleanup = () => {
    classSocketService.cleanup();
    setSocketStatus('Cleaned up');
    setConnectionStatus('Disconnected');
    setCurrentClassId(null);
    setEvents([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Class Socket.IO Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Socket Status: {socketStatus}</Text>
        <Text style={styles.statusText}>Connection: {connectionStatus}</Text>
        <Text style={styles.statusText}>Current Class: {currentClassId || 'None'}</Text>
        <Text style={styles.statusText}>User ID: {user?._id || 'Not logged in'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testSocketConnection}>
          <Text style={styles.buttonText}>Initialize Socket</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={joinTestClass}>
          <Text style={styles.buttonText}>Join Test Class</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={leaveTestClass}>
          <Text style={styles.buttonText}>Leave Class</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={clearEvents}>
          <Text style={styles.buttonText}>Clear Events</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={cleanup}>
          <Text style={styles.buttonText}>Cleanup</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Real-time Events ({events.length})</Text>
        {events.length === 0 ? (
          <Text style={styles.noEvents}>No events received yet</Text>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventType}>{event.type}</Text>
              <Text style={styles.eventTime}>{event.timestamp}</Text>
              <Text style={styles.eventData} numberOfLines={3}>
                {event.data}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noEvents: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  eventType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  eventData: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
});
