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

      // Get some sample user IDs from the database
      const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();

      if (users.length === 0) {
        console.log('No users found in database. Please create users first.');
        return;
      }

      const sampleNotifications = [
        // Welcome notification for first user
        {
          recipientId: users[0]._id,
          type: 'announcement',
          title: 'Welcome to JuanLMS!',
          message: 'Hello everyone! Welcome to JuanLMS. We\'re excited to explore the fascinating world of learning together.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'normal',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          recipientId: users[0]._id,
          type: 'assignment',
          title: 'New Assignment: Lab Report #1',
          message: '"Lab Report #1" - Please submit your lab report by the end of the week.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'high',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        },
        {
          recipientId: users[0]._id,
          type: 'quiz',
          title: 'New Quiz: Chapter 1 Review',
          message: '"Chapter 1 Review" - Test your knowledge of Chapter 1 concepts.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'high',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        },
        {
          recipientId: users[0]._id,
          type: 'activity',
          title: 'New Activity: Field Trip Planning',
          message: '"Field Trip Planning" - New activity available for next week\'s field trip.',
          faculty: 'Dr. Smith',
          classID: 'C883',
          className: 'General Biology',
          classCode: 'C883',
          priority: 'normal',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        },
        {
          recipientId: users[0]._id,
          type: 'message',
          title: 'New Message Received',
          message: '"Hey, can you help me with the assignment?"',
          faculty: 'Dr. Smith',
          classID: 'direct_message',
          className: 'Direct Message',
          classCode: 'DM',
          priority: 'normal',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        // Add notifications for other users if available
        ...(users.length > 1 ? [
          {
            recipientId: users[1]._id,
            type: 'announcement',
            title: 'Class Schedule Update',
            message: 'There has been a change in the class schedule for next week.',
            faculty: 'Admin',
            classID: 'ADMIN',
            className: 'System',
            classCode: 'SYS',
            priority: 'normal',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            recipientId: users[1]._id,
            type: 'assignment',
            title: 'New Assignment: Research Paper',
            message: '"Research Paper" - New assignment posted for the research project.',
            faculty: 'Prof. Johnson',
            classID: 'MATH101',
            className: 'Advanced Mathematics',
            classCode: 'MATH101',
            priority: 'high',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
          }
        ] : [])
      ];

      // Insert sample notifications
      const result = await Notification.insertMany(sampleNotifications);

      console.log(`Successfully created ${result.length} sample notifications`);

      // Display the created notifications
      console.log('\nSample notifications created:');
      result.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.type.toUpperCase()}: ${notification.title}`);
        console.log(`   Recipient: ${notification.recipientId}`);
        console.log(`   Faculty: ${notification.faculty}`);
        console.log(`   Class: ${notification.className} (${notification.classCode})`);
        console.log(`   Time: ${notification.timestamp}`);
        console.log('');
      });

    } else {
      console.log('Sample notifications already exist. Skipping creation.');

      // Display existing notifications
      const existingNotificationsList = await Notification.find().sort({ timestamp: -1 }).limit(10);
      console.log('\nExisting notifications:');
      existingNotificationsList.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.type.toUpperCase()}: ${notification.title}`);
        console.log(`   Recipient: ${notification.recipientId}`);
        console.log(`   Faculty: ${notification.faculty}`);
        console.log(`   Class: ${notification.className} (${notification.classCode})`);
        console.log(`   Time: ${notification.timestamp}`);
        console.log(`   Read: ${notification.read}`);
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
