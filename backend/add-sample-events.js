import mongoose from 'mongoose';
import database from './connect.cjs';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function addSampleEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = database.getDb();
    
    // Check if Events collection exists and has data
    const collections = await db.listCollections().toArray();
    const eventsExists = collections.some(col => col.name === 'Events');
    
    if (!eventsExists) {
      console.log('Events collection does not exist. Creating it...');
    }
    
    // Check existing events
    const existingEvents = await db.collection('Events').countDocuments();
    console.log(`Found ${existingEvents} existing events`);
    
    if (existingEvents === 0) {
      console.log('Adding sample events to the database...');
      
      // Create sample events for the current month
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      const sampleEvents = [
        {
          title: 'Faculty Meeting',
          date: new Date(currentYear, currentMonth, today.getDate()),
          time: '9:00 AM',
          status: 'Scheduled',
          type: 'meeting',
          description: 'Monthly faculty meeting to discuss academic matters',
          location: 'Conference Room A',
          createdBy: 'System',
          createdAt: new Date()
        },
        {
          title: 'Class Preparation',
          date: new Date(currentYear, currentMonth, today.getDate() + 1),
          time: '2:00 PM',
          status: 'Pending',
          type: 'class',
          description: 'Prepare materials for upcoming classes',
          location: 'Faculty Office',
          createdBy: 'System',
          createdAt: new Date()
        },
        {
          title: 'Student Consultation',
          date: new Date(currentYear, currentMonth, today.getDate() + 2),
          time: '10:00 AM',
          status: 'Confirmed',
          type: 'consultation',
          description: 'Student consultation session',
          location: 'Faculty Office',
          createdBy: 'System',
          createdAt: new Date()
        },
        {
          title: 'Department Review',
          date: new Date(currentYear, currentMonth, today.getDate() + 7),
          time: '3:00 PM',
          status: 'Scheduled',
          type: 'review',
          description: 'Department performance review meeting',
          location: 'Conference Room B',
          createdBy: 'System',
          createdAt: new Date()
        },
        {
          title: 'Curriculum Planning',
          date: new Date(currentYear, currentMonth, today.getDate() + 10),
          time: '1:00 PM',
          status: 'Pending',
          type: 'planning',
          description: 'Curriculum planning session for next semester',
          location: 'Meeting Room 1',
          createdBy: 'System',
          createdAt: new Date()
        },
        {
          title: 'Faculty Development Workshop',
          date: new Date(currentYear, currentMonth, today.getDate() + 14),
          time: '9:00 AM',
          status: 'Scheduled',
          type: 'workshop',
          description: 'Professional development workshop for faculty',
          location: 'Training Center',
          createdBy: 'System',
          createdAt: new Date()
        }
      ];
      
      // Insert sample events
      const result = await db.collection('Events').insertMany(sampleEvents);
      console.log(`✅ Successfully added ${result.insertedCount} sample events`);
      
      // Display the added events
      console.log('\nSample events added:');
      sampleEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.date.toDateString()} at ${event.time}`);
      });
      
    } else {
      console.log('Events collection already has data. No need to add sample events.');
      
      // Show existing events
      const events = await db.collection('Events').find().limit(5).toArray();
      console.log('\nExisting events:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${new Date(event.date).toDateString()}`);
      });
    }

    console.log('\n🎉 Sample events setup completed!');
    console.log('The Faculty Calendar should now display events.');

  } catch (error) {
    console.error('Error adding sample events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addSampleEvents();
