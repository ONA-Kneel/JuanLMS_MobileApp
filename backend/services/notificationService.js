import Notification from '../models/Notification.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

/**
 * Get all students enrolled in a class
 * @param {string} classID - The class ID
 * @returns {Promise<Array>} Array of student user IDs
 */
export const getClassStudents = async (classID) => {
  try {
    const classInfo = await Class.findOne({ classID });
    if (!classInfo) {
      console.log(`Class ${classID} not found`);
      return [];
    }
    
    // Get student user IDs from the members array
    const studentUserIDs = classInfo.members || [];
    console.log(`Found ${studentUserIDs.length} students in class ${classID}`);
    
    // Convert userIDs to ObjectIds by finding users
    const students = await User.find({ userID: { $in: studentUserIDs } }, '_id');
    const studentObjectIds = students.map(student => student._id);
    
    console.log(`Converted to ${studentObjectIds.length} student ObjectIds`);
    return studentObjectIds;
  } catch (error) {
    console.error('Error getting class students:', error);
    return [];
  }
};

/**
 * Create notifications for all students in a class
 * @param {string} classID - The class ID
 * @param {Object} content - The content object (assignment, quiz, or announcement)
 * @param {string} type - The notification type
 * @param {string} facultyName - The faculty member's name
 * @returns {Promise<Array>} Array of created notifications
 */
export const createClassNotifications = async (classID, content, type, facultyName) => {
  try {
    console.log(`Creating ${type} notifications for class ${classID}`);
    
    // Get all students in the class
    const studentIds = await getClassStudents(classID);
    if (studentIds.length === 0) {
      console.log(`No students found in class ${classID}`);
      return [];
    }
    
    // Get class information
    const classInfo = await Class.findOne({ classID });
    if (!classInfo) {
      console.log(`Class ${classID} not found`);
      return [];
    }
    
    // Create notification data
    const notifications = studentIds.map(studentId => ({
      recipientId: studentId,
      type: type,
      title: getNotificationTitle(content, type),
      message: getNotificationMessage(content, type),
      faculty: facultyName || 'Faculty',
      classID: classID,
      className: classInfo.className || 'Unknown Class',
      classCode: classInfo.classCode || 'UNKNOWN',
      relatedItemId: content._id,
      priority: getNotificationPriority(content, type),
      read: false,
      timestamp: new Date()
    }));
    
    // Insert all notifications
    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`Created ${createdNotifications.length} notifications for class ${classID}`);
    
    return createdNotifications;
  } catch (error) {
    console.error('Error creating class notifications:', error);
    return [];
  }
};

/**
 * Create assignment notification
 * @param {string} classID - The class ID
 * @param {Object} assignment - The assignment object
 * @returns {Promise<Array>} Array of created notifications
 */
export const createAssignmentNotification = async (classID, assignment) => {
  try {
    // Get faculty name
    let facultyName = 'Faculty';
    if (assignment.createdBy) {
      const faculty = await User.findById(assignment.createdBy);
      if (faculty) {
        facultyName = `${faculty.firstname || ''} ${faculty.lastname || ''}`.trim() || 'Faculty';
      }
    }
    
    return await createClassNotifications(classID, assignment, 'assignment', facultyName);
  } catch (error) {
    console.error('Error creating assignment notification:', error);
    return [];
  }
};

/**
 * Create quiz notification
 * @param {string} classID - The class ID
 * @param {Object} quiz - The quiz object
 * @returns {Promise<Array>} Array of created notifications
 */
export const createQuizNotification = async (classID, quiz) => {
  try {
    // Get faculty name
    let facultyName = 'Faculty';
    if (quiz.createdBy) {
      const faculty = await User.findById(quiz.createdBy);
      if (faculty) {
        facultyName = `${faculty.firstname || ''} ${faculty.lastname || ''}`.trim() || 'Faculty';
      }
    }
    
    return await createClassNotifications(classID, quiz, 'quiz', facultyName);
  } catch (error) {
    console.error('Error creating quiz notification:', error);
    return [];
  }
};

/**
 * Create announcement notification
 * @param {string} classID - The class ID
 * @param {Object} announcement - The announcement object
 * @returns {Promise<Array>} Array of created notifications
 */
export const createAnnouncementNotification = async (classID, announcement) => {
  try {
    // Get faculty name
    let facultyName = 'Faculty';
    if (announcement.createdBy) {
      const faculty = await User.findById(announcement.createdBy);
      if (faculty) {
        facultyName = `${faculty.firstname || ''} ${faculty.lastname || ''}`.trim() || 'Faculty';
      }
    }
    
    return await createClassNotifications(classID, announcement, 'announcement', facultyName);
  } catch (error) {
    console.error('Error creating announcement notification:', error);
    return [];
  }
};

/**
 * Get notification title based on content type
 * @param {Object} content - The content object
 * @param {string} type - The notification type
 * @returns {string} The notification title
 */
const getNotificationTitle = (content, type) => {
  switch (type) {
    case 'assignment':
      return `New Assignment: ${content.title || 'Untitled Assignment'}`;
    case 'quiz':
      return `New Quiz: ${content.title || 'Untitled Quiz'}`;
    case 'announcement':
      return `New Announcement: ${content.title || 'Untitled Announcement'}`;
    default:
      return `New ${type}: ${content.title || 'Untitled'}`;
  }
};

/**
 * Get notification message based on content type
 * @param {Object} content - The content object
 * @param {string} type - The notification type
 * @returns {string} The notification message
 */
const getNotificationMessage = (content, type) => {
  switch (type) {
    case 'assignment':
      const dueDate = content.dueDate ? ` Due: ${new Date(content.dueDate).toLocaleDateString()}` : '';
      return `${content.description || content.instructions || 'A new assignment has been posted.'}${dueDate}`;
    case 'quiz':
      const timeLimit = content.timeLimit ? ` Time limit: ${content.timeLimit} minutes` : '';
      return `${content.description || 'A new quiz is now available.'}${timeLimit}`;
    case 'announcement':
      return content.content || 'A new announcement has been posted.';
    default:
      return content.description || content.content || `A new ${type} has been posted.`;
  }
};

/**
 * Get notification priority based on content
 * @param {Object} content - The content object
 * @param {string} type - The notification type
 * @returns {string} The notification priority
 */
const getNotificationPriority = (content, type) => {
  // Check if content has priority field
  if (content.priority) {
    return content.priority;
  }
  
  // Default priorities based on type
  switch (type) {
    case 'assignment':
      return 'high'; // Assignments are usually important
    case 'quiz':
      return 'high'; // Quizzes are usually important
    case 'announcement':
      return 'normal';
    default:
      return 'normal';
  }
};
