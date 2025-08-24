import mongoose from 'mongoose';
import Notification from './models/Notification.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function addSampleNotifications() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check existing notifications
    const existingNotifications = await Notification.countDocuments();
    console.log(`Found ${existingNotifications} existing notifications`);

    if (existingNotifications === 0) {
      console.log('Adding sample notifications to the database...');

      // Get a sample user ID from the database
      const db = mongoose.connection.db;
      const users = await db.collection('Users').find().limit(1).toArray();
      
      if (users.length === 0) {
        console.log('No users found in database. Cannot create notifications.');
        return;
      }

      const sampleUserId = users[0]._id;
      console.log(`Using sample user ID: ${sampleUserId}`);

      const sampleNotifications = [
        {
          recipientId: sampleUserId,
          type: 'assignment',
          title: 'New Assignment Posted',
          message: 'A new assignment has been posted for General Biology. Please check your assignments tab.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'high',
          read: false,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          recipientId: sampleUserId,
          type: 'quiz',
          title: 'Quiz Reminder',
          message: 'Remember to complete the Chapter 1 quiz by tomorrow. It covers basic biology concepts.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'normal',
          read: false,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        {
          recipientId: sampleUserId,
          type: 'activity',
          title: 'Lab Session Tomorrow',
          message: 'Tomorrow\'s lab session will focus on microscope usage. Please bring your lab manual.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'normal',
          read: true,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          recipientId: sampleUserId,
          type: 'message',
          title: 'Direct Message from Faculty',
          message: 'Hi! I wanted to discuss your recent assignment submission. Can we meet during office hours?',
          faculty: 'Dr. Smith',
          classID: 'direct_message',
          className: 'Direct Message',
          classCode: 'DM',
          priority: 'normal',
          read: false,
          timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        {
          recipientId: sampleUserId,
          type: 'announcement',
          title: 'Class Cancellation',
          message: 'Due to faculty meeting, tomorrow\'s 9 AM class is cancelled. We will resume on Friday.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'urgent',
          read: false,
          timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        }
      ];

      // Insert sample notifications
      const result = await Notification.insertMany(sampleNotifications);

      console.log(`Successfully created ${result.length} sample notifications`);

      // Display the created notifications
      console.log('\nSample notifications created:');
      result.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Faculty: ${notification.faculty}`);
        console.log(`   Class: ${notification.className} (${notification.classCode})`);
        console.log(`   Priority: ${notification.priority}`);
        console.log(`   Read: ${notification.read}`);
        console.log(`   Time: ${notification.timestamp}`);
        console.log('');
      });

    } else {
      console.log('Sample notifications already exist. Skipping creation.');

      // Display existing notifications
      const existingNotificationsList = await Notification.find().sort({ timestamp: -1 }).limit(10);
      console.log('\nExisting notifications:');
      existingNotificationsList.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Faculty: ${notification.faculty}`);
        console.log(`   Class: ${notification.className} (${notification.classCode})`);
        console.log(`   Priority: ${notification.priority}`);
        console.log(`   Read: ${notification.read}`);
        console.log(`   Time: ${notification.timestamp}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error adding sample notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addSampleNotifications();
