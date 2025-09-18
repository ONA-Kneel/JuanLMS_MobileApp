const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseAdmin = null;

const initializeFirebaseAdmin = () => {
  try {
    if (firebaseAdmin) {
      return firebaseAdmin;
    }

    // For production, use service account key file
    // For development, you can use environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Initialize Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
};

// Get Firebase Admin instance
const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
};

// Send notification to single device
const sendNotificationToDevice = async (fcmToken, notification) => {
  try {
    const admin = getFirebaseAdmin();
    
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          channelId: 'juanlms_notifications',
          priority: 'high',
          sound: 'default',
          color: '#00418b',
          icon: 'ic_notification',
          ...notification.android
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default',
            badge: 1,
            ...notification.ios
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification to device:', error);
    throw error;
  }
};

// Send notification to multiple devices
const sendNotificationToMultipleDevices = async (fcmTokens, notification) => {
  try {
    const admin = getFirebaseAdmin();
    
    const message = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          channelId: 'juanlms_notifications',
          priority: 'high',
          sound: 'default',
          color: '#00418b',
          icon: 'ic_notification',
          ...notification.android
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default',
            badge: 1,
            ...notification.ios
          }
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent notification to multiple devices:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification to multiple devices:', error);
    throw error;
  }
};

// Send notification to topic
const sendNotificationToTopic = async (topic, notification) => {
  try {
    const admin = getFirebaseAdmin();
    
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          channelId: 'juanlms_notifications',
          priority: 'high',
          sound: 'default',
          color: '#00418b',
          icon: 'ic_notification',
          ...notification.android
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default',
            badge: 1,
            ...notification.ios
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    throw error;
  }
};

// Send chat message notification
const sendChatMessageNotification = async (recipientToken, senderName, message, isGroup = false, groupName = null) => {
  try {
    const notification = {
      title: isGroup ? `New message in ${groupName}` : `New message from ${senderName}`,
      body: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      data: {
        type: isGroup ? 'group_message' : 'message',
        senderName,
        message,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        sound: 'default',
        vibrate: true
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    return await sendNotificationToDevice(recipientToken, notification);
  } catch (error) {
    console.error('Error sending chat message notification:', error);
    throw error;
  }
};

// Send announcement notification
const sendAnnouncementNotification = async (recipientTokens, announcement) => {
  try {
    const notification = {
      title: `New Announcement: ${announcement.title}`,
      body: announcement.content.length > 100 ? `${announcement.content.substring(0, 100)}...` : announcement.content,
      data: {
        type: 'announcement',
        announcementId: announcement._id,
        classId: announcement.classID,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        sound: 'default'
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    return await sendNotificationToMultipleDevices(recipientTokens, notification);
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    throw error;
  }
};

// Send assignment notification
const sendAssignmentNotification = async (recipientTokens, assignment) => {
  try {
    const notification = {
      title: `New Assignment: ${assignment.title}`,
      body: assignment.description ? 
        (assignment.description.length > 100 ? `${assignment.description.substring(0, 100)}...` : assignment.description) :
        'A new assignment has been posted',
      data: {
        type: 'assignment',
        assignmentId: assignment._id,
        classId: assignment.classID,
        dueDate: assignment.dueDate,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        sound: 'default'
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    return await sendNotificationToMultipleDevices(recipientTokens, notification);
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    throw error;
  }
};

// Send quiz notification
const sendQuizNotification = async (recipientTokens, quiz) => {
  try {
    const notification = {
      title: `New Quiz: ${quiz.title}`,
      body: quiz.description ? 
        (quiz.description.length > 100 ? `${quiz.description.substring(0, 100)}...` : quiz.description) :
        'A new quiz is now available',
      data: {
        type: 'quiz',
        quizId: quiz._id,
        classId: quiz.classID,
        timeLimit: quiz.timeLimit,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        sound: 'default'
      },
      ios: {
        sound: 'default',
        badge: 1
      }
    };

    return await sendNotificationToMultipleDevices(recipientTokens, notification);
  } catch (error) {
    console.error('Error sending quiz notification:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
  sendChatMessageNotification,
  sendAnnouncementNotification,
  sendAssignmentNotification,
  sendQuizNotification
};
