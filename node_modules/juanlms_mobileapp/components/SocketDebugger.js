import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  StyleSheet,
  Switch
} from 'react-native';
import { useUser } from './UserContext';
import classSocketService from '../services/classSocketService';
import { socketLog } from '../config/socketConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SocketDebugger = () => {
  const { user } = useUser();
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [testClassId, setTestClassId] = useState('C883');
  const [testMessage, setTestMessage] = useState('Test message from mobile app');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showDebugLogs, setShowDebugLogs] = useState(true);
  const scrollViewRef = useRef();
  const logUpdateRef = useRef();

  // Override console methods to capture logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug
    };

    const addLog = (level, message, data = null) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp,
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        data: data ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : null
      };

      setLogs(prev => {
        const updated = [...prev, logEntry];
        // Keep only last 100 logs to prevent memory issues
        return updated.slice(-100);
      });

      // Auto-scroll to bottom if enabled
      if (autoScroll) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Intercept console methods for socket-related logs
    console.log = (...args) => {
      originalConsole.log(...args);
      const message = args.join(' ');
      if (message.includes('SOCKET') || message.includes('Socket') || message.includes('[StudentModule]') || message.includes('[ClassSocketService]')) {
        addLog('info', message);
      }
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      const message = args.join(' ');
      if (message.includes('SOCKET') || message.includes('Socket') || message.includes('[StudentModule]') || message.includes('[ClassSocketService]')) {
        addLog('error', message);
      }
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      const message = args.join(' ');
      if (message.includes('SOCKET') || message.includes('Socket') || message.includes('[StudentModule]') || message.includes('[ClassSocketService]')) {
        addLog('warn', message);
      }
    };

    return () => {
      // Restore original console methods
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.debug = originalConsole.debug;
    };
  }, [autoScroll]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = classSocketService.isSocketConnected();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'Connected' : 'Disconnected');
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const addDebugLog = (level, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };

    setLogs(prev => [...prev, logEntry].slice(-100));
    
    if (autoScroll) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const initializeSocket = async () => {
    try {
      addDebugLog('info', 'Initializing socket connection...');
      
      if (!user || !user._id) {
        addDebugLog('error', 'Cannot initialize - user not found', { user });
        return;
      }

      // Check for JWT token
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        addDebugLog('error', 'No JWT token found in storage');
        return;
      }

      addDebugLog('debug', 'JWT token found, initializing socket service');
      
      const socket = await classSocketService.initialize(user._id);
      
      if (socket) {
        addDebugLog('success', 'Socket initialized successfully', {
          socketId: socket.id,
          connected: socket.connected,
          userId: user._id
        });
        
        // Set up test event listeners
        classSocketService.addEventListener('testResponse', (data) => {
          addDebugLog('info', 'Test response received from server', data);
        });

        classSocketService.addEventListener('newAnnouncement', (data) => {
          addDebugLog('info', 'New announcement event received', {
            classID: data?.classID,
            title: data?.announcement?.title
          });
        });

      } else {
        addDebugLog('error', 'Socket initialization returned null');
      }
    } catch (error) {
      addDebugLog('error', 'Socket initialization failed', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  const joinTestClass = () => {
    try {
      if (!testClassId.trim()) {
        addDebugLog('error', 'No class ID provided');
        return;
      }

      addDebugLog('info', `Attempting to join class: ${testClassId}`);
      classSocketService.joinClass(testClassId);
      addDebugLog('debug', 'Join class command sent');
    } catch (error) {
      addDebugLog('error', 'Error joining class', error);
    }
  };

  const leaveTestClass = () => {
    try {
      if (!testClassId.trim()) {
        addDebugLog('error', 'No class ID provided');
        return;
      }

      addDebugLog('info', `Attempting to leave class: ${testClassId}`);
      classSocketService.leaveClass(testClassId);
      addDebugLog('debug', 'Leave class command sent');
    } catch (error) {
      addDebugLog('error', 'Error leaving class', error);
    }
  };

  const sendTestMessage = () => {
    try {
      if (!classSocketService.socket) {
        addDebugLog('error', 'No socket connection available');
        return;
      }

      const testData = {
        userId: user?._id,
        message: testMessage,
        timestamp: Date.now(),
        classId: testClassId
      };

      addDebugLog('info', 'Sending test message to server', testData);
      classSocketService.socket.emit('test', testData);
    } catch (error) {
      addDebugLog('error', 'Error sending test message', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addDebugLog('info', 'Logs cleared');
  };

  const getLogStyle = (level) => {
    switch (level) {
      case 'error': return [styles.logEntry, styles.errorLog];
      case 'warn': return [styles.logEntry, styles.warnLog];
      case 'success': return [styles.logEntry, styles.successLog];
      case 'debug': return [styles.logEntry, styles.debugLog];
      default: return [styles.logEntry, styles.infoLog];
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + log.data : ''}`
    ).join('\n\n');
    
    // In a real app, you might want to share or save this
    Alert.alert('Logs Exported', 'Logs copied to clipboard (in a real implementation)');
    console.log('EXPORTED LOGS:\n', logText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Socket Debugger</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={initializeSocket}>
          <Text style={styles.buttonText}>Initialize Socket</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Test Class ID:</Text>
          <TextInput
            style={styles.textInput}
            value={testClassId}
            onChangeText={setTestClassId}
            placeholder="Enter class ID (e.g., C883)"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={joinTestClass}>
            <Text style={styles.buttonText}>Join Class</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={leaveTestClass}>
            <Text style={styles.buttonText}>Leave Class</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Test Message:</Text>
          <TextInput
            style={styles.textInput}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Enter test message"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={sendTestMessage}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>

        <View style={styles.optionsRow}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Auto Scroll</Text>
            <Switch value={autoScroll} onValueChange={setAutoScroll} />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Debug Logs</Text>
            <Switch value={showDebugLogs} onValueChange={setShowDebugLogs} />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={clearLogs}>
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={exportLogs}>
            <Text style={styles.buttonText}>Export Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Socket Logs ({logs.length})</Text>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.logsScrollView}
          showsVerticalScrollIndicator={true}
        >
          {logs
            .filter(log => showDebugLogs || log.level !== 'debug')
            .map(log => (
            <View key={log.id} style={getLogStyle(log.level)}>
              <Text style={styles.logTimestamp}>[{log.timestamp}]</Text>
              <Text style={styles.logLevel}>{log.level.toUpperCase()}</Text>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>{log.data}</Text>
              )}
            </View>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogs}>No logs yet. Initialize socket to start debugging.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  controls: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#2A7DE1',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 5,
    alignItems: 'center',
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logsScrollView: {
    flex: 1,
    padding: 10,
  },
  logEntry: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  infoLog: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#007bff',
  },
  errorLog: {
    backgroundColor: '#fff5f5',
    borderLeftColor: '#dc3545',
  },
  warnLog: {
    backgroundColor: '#fffdf0',
    borderLeftColor: '#ffc107',
  },
  successLog: {
    backgroundColor: '#f0fff4',
    borderLeftColor: '#28a745',
  },
  debugLog: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#6c757d',
  },
  logTimestamp: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  logMessage: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  logData: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginTop: 6,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  noLogs: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 50,
  },
});

export default SocketDebugger;


