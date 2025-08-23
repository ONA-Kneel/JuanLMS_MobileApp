import mongoose from 'mongoose';
import GeneralAnnouncement from './models/GeneralAnnouncement.js';

const MONGODB_URI = 'mongodb+srv://Rayhan:webprogrammer123@juanlms.td1v92f.mongodb.net/JuanLMS?retryWrites=true&w=majority&appName=JuanLMS';

async function addSampleAnnouncements() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check existing announcements
    const existingAnnouncements = await GeneralAnnouncement.countDocuments();
    console.log(`Found ${existingAnnouncements} existing announcements`);

    if (existingAnnouncements === 0) {
      console.log('Adding sample announcements to the database...');

      const sampleAnnouncements = [
        {
          title: 'Welcome to the New Academic Year',
          body: 'Welcome to the 2025-2026 academic year! We are excited to have all students back on campus. Please make sure to check your class schedules and attend orientation sessions.',
          recipientRoles: ['students', 'faculty'],
          termName: 'First Semester',
          schoolYear: '2025-2026',
          createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
        },
        {
          title: 'Important: Midterm Examination Schedule',
          body: 'The midterm examinations will begin next week. Please check the examination schedule posted on the bulletin board and ensure you bring all necessary materials.',
          recipientRoles: ['students'],
          termName: 'First Semester',
          schoolYear: '2025-2026',
          createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          title: 'Faculty Meeting Reminder',
          body: 'All faculty members are reminded of the monthly faculty meeting this Friday at 2:00 PM in the conference room. Attendance is mandatory.',
          recipientRoles: ['faculty'],
          termName: 'First Semester',
          schoolYear: '2025-2026',
          createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          title: 'Student Council Elections',
          body: 'Student council elections will be held next month. All students are encouraged to participate and vote for their representatives.',
          recipientRoles: ['students'],
          termName: 'First Semester',
          schoolYear: '2025-2026',
          createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          title: 'Library Hours Update',
          body: 'The library will now be open until 9:00 PM on weekdays to accommodate evening study sessions. Weekend hours remain the same.',
          recipientRoles: ['students', 'faculty'],
          termName: 'First Semester',
          schoolYear: '2025-2026',
          createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        }
      ];

      // Insert sample announcements
      const result = await GeneralAnnouncement.insertMany(sampleAnnouncements);

      console.log(`Successfully created ${result.length} sample announcements`);

      // Display the created announcements
      console.log('\nSample announcements created:');
      result.forEach((announcement, index) => {
        console.log(`${index + 1}. ${announcement.title}`);
        console.log(`   Recipients: ${announcement.recipientRoles.join(', ')}`);
        console.log(`   Term: ${announcement.termName}`);
        console.log(`   School Year: ${announcement.schoolYear}`);
        console.log(`   Time: ${announcement.createdAt}`);
        console.log('');
      });

    } else {
      console.log('Sample announcements already exist. Skipping creation.');

      // Display existing announcements
      const existingAnnouncementsList = await GeneralAnnouncement.find().sort({ createdAt: -1 }).limit(10);
      console.log('\nExisting announcements:');
      existingAnnouncementsList.forEach((announcement, index) => {
        console.log(`${index + 1}. ${announcement.title}`);
        console.log(`   Recipients: ${announcement.recipientRoles.join(', ')}`);
        console.log(`   Term: ${announcement.termName}`);
        console.log(`   School Year: ${announcement.schoolYear}`);
        console.log(`   Time: ${announcement.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error adding sample announcements:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addSampleAnnouncements();
