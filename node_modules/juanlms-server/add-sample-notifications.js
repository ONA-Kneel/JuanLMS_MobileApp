import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config({ path: './config.env' });

const addSampleNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Sample user ID (replace with actual user ID from your database)
    const sampleUserId = '68c1a45da6e937423775df0b';

    // Clear existing notifications for this user
    await Notification.deleteMany({ recipientId: sampleUserId });
    console.log('Cleared existing notifications for user');

    // Add sample notifications
    const sampleNotifications = [
      {
        recipientId: sampleUserId,
        type: 'announcement',
        title: 'Welcome to JuanLMS!',
        message: 'Welcome to the JuanLMS mobile app. You can now access your classes, assignments, and notifications on the go.',
        faculty: 'System Administrator',
        classID: 'general',
        className: 'General',
        classCode: 'GEN001',
        priority: 'normal',
        read: false,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        recipientId: sampleUserId,
        type: 'assignment',
        title: 'New Assignment Posted',
        message: 'Mathematics Assignment #3 has been posted. Due date: Tomorrow at 11:59 PM',
        faculty: 'Dr. Smith',
        classID: 'math101',
        className: 'Mathematics 101',
        classCode: 'MATH101',
        priority: 'high',
        read: false,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        recipientId: sampleUserId,
        type: 'quiz',
        title: 'Quiz Results Available',
        message: 'Your quiz results for Science Quiz #2 are now available. Check your grades!',
        faculty: 'Prof. Johnson',
        classID: 'sci201',
        className: 'Science 201',
        classCode: 'SCI201',
        priority: 'normal',
        read: true,
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        recipientId: sampleUserId,
        type: 'message',
        title: 'New Message from Faculty',
        message: 'Please check the updated syllabus for next week\'s topics.',
        faculty: 'Dr. Brown',
        classID: 'eng101',
        className: 'English 101',
        classCode: 'ENG101',
        priority: 'normal',
        read: false,
        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      }
    ];

    // Insert sample notifications
    const inserted = await Notification.insertMany(sampleNotifications);
    console.log(`Added ${inserted.length} sample notifications`);

    // Verify the notifications were added
    const count = await Notification.countDocuments({ recipientId: sampleUserId });
    console.log(`Total notifications for user: ${count}`);

    // Show the notifications
    const notifications = await Notification.find({ recipientId: sampleUserId }).sort({ timestamp: -1 });
    console.log('\nSample notifications:');
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type.toUpperCase()}] ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Faculty: ${notif.faculty}`);
      console.log(`   Read: ${notif.read}`);
      console.log(`   Time: ${notif.timestamp}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error adding sample notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addSampleNotifications();