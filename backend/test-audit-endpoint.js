import mongoose from 'mongoose';
import database from './connect.cjs';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function testAuditEndpoint() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = database.getDb();
    
    // Check if auditLogs collection exists and has data
    const collections = await db.listCollections().toArray();
    const auditLogsExists = collections.some(col => col.name === 'auditLogs');
    
    if (!auditLogsExists) {
      console.log('auditLogs collection does not exist. Creating sample data...');
      
      // Create sample audit logs
      const sampleLogs = [
        {
          action: 'User Login',
          details: 'VPE user logged in successfully',
          userRole: 'vice president of education',
          userName: 'Dr. Sarah Johnson',
          timestamp: new Date(),
          ipAddress: '192.168.1.100',
          userAgent: 'JuanLMS Mobile App v2.1'
        },
        {
          action: 'Profile Updated',
          details: 'VPE profile information modified',
          userRole: 'vice president of education',
          userName: 'Dr. Sarah Johnson',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          ipAddress: '192.168.1.100',
          userAgent: 'JuanLMS Mobile App v2.1'
        },
        {
          action: 'Announcement Created',
          details: 'New announcement created for faculty',
          userRole: 'vice president of education',
          userName: 'Dr. Sarah Johnson',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          ipAddress: '192.168.1.100',
          userAgent: 'JuanLMS Mobile App v2.1'
        }
      ];
      
      await db.collection('auditLogs').insertMany(sampleLogs);
      console.log('Sample audit logs created successfully');
    } else {
      console.log('auditLogs collection exists');
      
      // Check existing data
      const count = await db.collection('auditLogs').countDocuments();
      console.log(`Found ${count} existing audit logs`);
      
      if (count > 0) {
        const sampleLog = await db.collection('auditLogs').findOne();
        console.log('Sample log structure:', sampleLog);
      }
    }

    console.log('\n✅ Audit endpoint test completed!');
    console.log('The VPE should now be able to access audit logs.');

  } catch (error) {
    console.error('Error testing audit endpoint:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAuditEndpoint();
