import express from 'express';
import database from '../connect.cjs';
import { ObjectId } from 'mongodb';

const router = express.Router();

function generateClassID() {
    return "C" + Math.floor(100 + Math.random() * 900); // e.g. C213
}

router.post('/classes', async (req, res) => {
    try {
        const db = database.getDb();
        let { classID, className, classCode, classDesc, members, facultyID } = req.body;
        if (!classID) {
            classID = generateClassID();
        }
        const newClass = { classID, className, classCode, classDesc, members, facultyID };
        console.log('Creating class:', newClass);
        console.log('Members array:', members);
        console.log('Members type:', typeof members);
        console.log('Members length:', members ? members.length : 'undefined');
        const result = await db.collection('Classes').insertOne(newClass);
        res.status(201).json({ success: true, class: newClass, insertedId: result.insertedId });
    } catch (err) {
        console.error('Error creating class:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Test route to create a sample class for testing
router.post('/test/create-sample-class', async (req, res) => {
    try {
        const db = database.getDb();
        
        // Create a sample class with ObjectId for student and faculty
        const sampleClass = {
            classID: "C123",
            className: "Introduction to Computer Science",
            classCode: "CS101",
            classDesc: "Basic computer science concepts",
            members: [new ObjectId("6845bdd2a05093bb0765c450")], // Use ObjectId format
            facultyID: new ObjectId("6845bdd2a05093bb0765c450"), // Use ObjectId format for faculty too
            image: ""
        };
        
        console.log('Creating sample class:', {
            ...sampleClass,
            members: sampleClass.members.map(m => m.toString()),
            facultyID: sampleClass.facultyID.toString()
        });
        
        // Check if class already exists
        const existingClass = await db.collection('Classes').findOne({ classID: sampleClass.classID });
        if (existingClass) {
            return res.json({ 
                success: true, 
                message: 'Sample class already exists',
                class: existingClass 
            });
        }
        
        const result = await db.collection('Classes').insertOne(sampleClass);
        console.log('Sample class created with ID:', result.insertedId);
        
        res.json({ 
            success: true, 
            message: 'Sample class created successfully',
            class: {
                ...sampleClass,
                members: sampleClass.members.map(m => m.toString()),
                facultyID: sampleClass.facultyID.toString()
            },
            insertedId: result.insertedId 
        });
    } catch (err) {
        console.error('Error creating sample class:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Test route to analyze database structure
router.get('/test/analyze-database', async (req, res) => {
    try {
        const db = database.getDb();
        
        // Get all classes
        const allClasses = await db.collection('Classes').find({}).toArray();
        
        // Get all users
        const allUsers = await db.collection('users').find({}).toArray();
        
        console.log('=== DATABASE ANALYSIS ===');
        console.log('Total classes:', allClasses.length);
        console.log('Total users:', allUsers.length);
        
        if (allClasses.length > 0) {
            console.log('=== CLASS STRUCTURE ===');
            allClasses.forEach((cls, index) => {
                console.log(`Class ${index + 1}:`, {
                    _id: cls._id,
                    classID: cls.classID,
                    className: cls.className,
                    facultyID: cls.facultyID,
                    facultyIDType: typeof cls.facultyID,
                    facultyIDString: cls.facultyID ? cls.facultyID.toString() : 'null',
                    members: cls.members ? cls.members.length : 0,
                    membersType: cls.members ? typeof cls.members : 'undefined'
                });
            });
        }
        
        if (allUsers.length > 0) {
            console.log('=== USER STRUCTURE ===');
            allUsers.forEach((user, index) => {
                console.log(`User ${index + 1}:`, {
                    _id: user._id,
                    userID: user.userID,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    role: user.role
                });
            });
        }
        
        res.json({
            success: true,
            analysis: {
                totalClasses: allClasses.length,
                totalUsers: allUsers.length,
                classes: allClasses,
                users: allUsers
            }
        });
        
    } catch (err) {
        console.error('Error analyzing database:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get student assignments for a specific date
router.get('/student-assignments', async (req, res) => {
    try {
        const db = database.getDb();
        const { studentID, date } = req.query;
        
        console.log('Fetching assignments for student:', studentID, 'on date:', date);
        
        if (!studentID) {
            return res.status(400).json({ success: false, error: 'studentID is required' });
        }

        // For now, return empty assignments array since we don't have assignments collection yet
        // This prevents the 404 error and allows the app to function
        const assignments = [];
        
        console.log('Found assignments:', assignments.length);

        res.json({ 
            success: true, 
            assignments: assignments
        });
    } catch (err) {
        console.error('Error fetching student assignments:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get classes for a specific student
router.get('/student-classes', async (req, res) => {
    try {
        const db = database.getDb();
        const { studentID } = req.query;
        
        console.log('Fetching classes for student:', studentID);
        
        if (!studentID) {
            return res.status(400).json({ success: false, error: 'studentID is required' });
        }

        // First, let's check what classes exist in the database
        const allClasses = await db.collection('Classes').find({}).toArray();
        console.log('All classes in database:', allClasses.length);
        if (allClasses.length > 0) {
            console.log('Sample class structure:', {
                classID: allClasses[0].classID,
                className: allClasses[0].className,
                members: allClasses[0].members,
                membersType: typeof allClasses[0].members,
                isArray: Array.isArray(allClasses[0].members)
            });
        }

        // Let's also check the user to see their userID format
        const user = await db.collection('users').findOne({ _id: new ObjectId(studentID) });
        console.log('User found:', user ? { 
            _id: user._id, 
            userID: user.userID, 
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        } : 'Not found');

        // Try multiple approaches to find the student
        let classes = [];

        // Approach 1: Try with ObjectId conversion first (most likely to work)
        try {
            const objectId = new ObjectId(studentID);
            classes = await db.collection('Classes')
                .find({ 
                    "members": objectId
                })
                .toArray();
            console.log('Approach 1 (ObjectId direct match):', classes.length, 'classes found');
        } catch (e) {
            console.log('Could not convert to ObjectId for direct match:', e.message);
        }

        // Approach 2: Try with ObjectId in array
        if (classes.length === 0) {
            try {
                const objectId = new ObjectId(studentID);
                classes = await db.collection('Classes')
                    .find({ 
                        "members": { $elemMatch: { $eq: objectId } }
                    })
                    .toArray();
                console.log('Approach 2 (ObjectId in array):', classes.length, 'classes found');
            } catch (e) {
                console.log('Could not convert to ObjectId for array match:', e.message);
            }
        }

        // Approach 3: Check if members array contains the studentID string
        if (classes.length === 0) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": { $elemMatch: { $eq: studentID } }
                })
                .toArray();
            console.log('Approach 3 (string in array):', classes.length, 'classes found');
        }

        // Approach 4: Check if members array contains the studentID as direct match
        if (classes.length === 0) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": studentID
                })
                .toArray();
            console.log('Approach 4 (string direct match):', classes.length, 'classes found');
        }

        // Approach 5: Try with userID if available
        if (classes.length === 0 && user && user.userID) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": user.userID
                })
                .toArray();
            console.log('Approach 5 (userID match):', classes.length, 'classes found');
        }

        // Approach 6: Try with email if available
        if (classes.length === 0 && user && user.email) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": user.email
                })
                .toArray();
            console.log('Approach 6 (email match):', classes.length, 'classes found');
        }

        // Approach 7: Try with userID in array
        if (classes.length === 0 && user && user.userID) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": { $elemMatch: { $eq: user.userID } }
                })
                .toArray();
            console.log('Approach 7 (userID in array):', classes.length, 'classes found');
        }

        console.log('Final classes found:', classes.length);
        if (classes.length > 0) {
            console.log('First class details:', {
                classID: classes[0].classID,
                className: classes[0].className,
                members: classes[0].members
            });
        }

        res.json({ 
            success: true, 
            classes: classes.map(c => ({
                ...c,
                className: c.className || c.name,
                classCode: c.classCode || c.code
            }))
        });
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get classes for a specific faculty
router.get('/faculty-classes', async (req, res) => {
    try {
        const db = database.getDb();
        const { facultyID } = req.query;
        
        console.log('Fetching classes for faculty:', facultyID);
        
        if (!facultyID) {
            return res.status(400).json({ success: false, error: 'facultyID is required' });
        }

        // Get all classes in database for debugging
        const allClasses = await db.collection('Classes').find({}).toArray();
        console.log('All classes in database:', allClasses.length);
        if (allClasses.length > 0) {
            console.log('Sample class structure:', {
                classID: allClasses[0].classID,
                className: allClasses[0].className,
                facultyID: allClasses[0].facultyID,
                facultyIDType: typeof allClasses[0].facultyID
            });
            
            // Show ALL faculty IDs in the database
            console.log('All faculty IDs in database:');
            allClasses.forEach((cls, index) => {
                console.log(`Class ${index + 1}:`, {
                    classID: cls.classID,
                    className: cls.className,
                    facultyID: cls.facultyID,
                    facultyIDType: typeof cls.facultyID,
                    facultyIDString: cls.facultyID ? cls.facultyID.toString() : 'null'
                });
            });
        }

        // Get user details for debugging
        const user = await db.collection('users').findOne({ _id: new ObjectId(facultyID) });
        console.log('Faculty user found:', user ? {
            _id: user._id,
            userID: user.userID,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        } : 'Not found');

        let classes = [];
        
        // Approach 1: Try with string direct match
        classes = await db.collection('Classes')
            .find({ "facultyID": facultyID })
            .toArray();
        console.log('Approach 1 (string direct match):', classes.length, 'classes found');

        // Approach 2: Try with ObjectId conversion
        if (classes.length === 0) {
            try {
                const objectId = new ObjectId(facultyID);
                classes = await db.collection('Classes')
                    .find({ "facultyID": objectId })
                    .toArray();
                console.log('Approach 2 (ObjectId match):', classes.length, 'classes found');
            } catch (e) {
                console.log('Could not convert to ObjectId:', e.message);
            }
        }

        // Approach 3: Try with userID if available
        if (classes.length === 0 && user && user.userID) {
            classes = await db.collection('Classes')
                .find({ "facultyID": user.userID })
                .toArray();
            console.log('Approach 3 (userID match):', classes.length, 'classes found');
        }

        // Approach 4: Try with email if available
        if (classes.length === 0 && user && user.email) {
            classes = await db.collection('Classes')
                .find({ "facultyID": user.email })
                .toArray();
            console.log('Approach 4 (email match):', classes.length, 'classes found');
        }

        // Approach 5: Try with ObjectId string representation
        if (classes.length === 0) {
            classes = await db.collection('Classes')
                .find({ "facultyID": facultyID.toString() })
                .toArray();
            console.log('Approach 5 (ObjectId string):', classes.length, 'classes found');
        }

        // Approach 6: Try to find ANY class where facultyID matches in any format
        if (classes.length === 0) {
            console.log('Approach 6: Checking all classes for any facultyID match...');
            const matchingClasses = allClasses.filter(cls => {
                if (!cls.facultyID) return false;
                
                const clsFacultyID = cls.facultyID.toString();
                const searchFacultyID = facultyID.toString();
                
                return clsFacultyID === searchFacultyID;
            });
            
            if (matchingClasses.length > 0) {
                classes = matchingClasses;
                console.log('Approach 6 (manual filtering):', classes.length, 'classes found');
            } else {
                console.log('Approach 6: No matches found with manual filtering');
            }
        }

        // Approach 7: Try with different ObjectId formats
        if (classes.length === 0) {
            try {
                const objectId = new ObjectId(facultyID);
                const objectIdString = objectId.toString();
                
                // Try matching against ObjectId string
                classes = await db.collection('Classes')
                    .find({ "facultyID": objectIdString })
                    .toArray();
                console.log('Approach 7 (ObjectId string match):', classes.length, 'classes found');
                
                // If still no results, try with the original ObjectId
                if (classes.length === 0) {
                    classes = await db.collection('Classes')
                        .find({ "facultyID": objectId })
                        .toArray();
                    console.log('Approach 7 (ObjectId direct match):', classes.length, 'classes found');
                }
            } catch (e) {
                console.log('Could not convert to ObjectId for approach 7:', e.message);
            }
        }

        console.log('Final faculty classes found:', classes.length);
        if (classes.length > 0) {
            console.log('First faculty class details:', {
                classID: classes[0].classID,
                className: classes[0].className,
                facultyID: classes[0].facultyID
            });
        }

        res.json({ 
            success: true, 
            classes: classes.map(c => ({
                ...c,
                className: c.className || c.name,
                classCode: c.classCode || c.code
            }))
        });
    } catch (err) {
        console.error('Error fetching faculty classes:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all classes (for admin purposes)
router.get('/classes', async (req, res) => {
    try {
        const db = database.getDb();
        const classes = await db.collection('Classes').find({}).toArray();
        res.json({ 
            success: true, 
            classes: classes.map(c => ({
                ...c,
                className: c.className || c.name,
                classCode: c.classCode || c.code
            }))
        });
    } catch (err) {
        console.error('Error fetching all classes:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get specific class by ID
router.get('/classes/:classId', async (req, res) => {
    try {
        const db = database.getDb();
        const { classId } = req.params;
        
        let classData = await db.collection('Classes').findOne({ classID: classId });
        
        if (!classData) {
            try {
                const objectId = new ObjectId(classId);
                classData = await db.collection('Classes').findOne({ _id: objectId });
            } catch (e) {
                console.log('Could not convert to ObjectId:', e.message);
            }
        }

        if (!classData) {
            return res.status(404).json({ success: false, error: 'Class not found' });
        }

        res.json({ 
            success: true, 
            class: {
                ...classData,
                className: classData.className || classData.name,
                classCode: classData.classCode || classData.code
            }
        });
    } catch (err) {
        console.error('Error fetching class:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get class members
router.get('/classes/:classId/members', async (req, res) => {
    try {
        const db = database.getDb();
        const { classId } = req.params;
        
        const classData = await db.collection('Classes').findOne({ classID: classId });
        if (!classData) {
            return res.status(404).json({ success: false, error: 'Class not found' });
        }

        // Get faculty member
        const faculty = await db.collection('users').findOne({ userID: classData.facultyID });
        
        // Get student members
        const students = classData.members && classData.members.length > 0 
            ? await db.collection('users').find({ userID: { $in: classData.members } }).toArray()
            : [];

        res.json({ 
            success: true, 
            faculty: faculty || null,
            students: students
        });
    } catch (err) {
        console.error('Error fetching class members:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Debug route to check all classes
router.get('/debug/classes', async (req, res) => {
    try {
        const db = database.getDb();
        const allClasses = await db.collection('Classes').find({}).toArray();
        console.log('All classes in database:', allClasses);
        res.json({ 
            success: true, 
            totalClasses: allClasses.length,
            classes: allClasses 
        });
    } catch (err) {
        console.error('Error fetching all classes:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Debug route to check a specific user
router.get('/debug/user/:userId', async (req, res) => {
    try {
        const db = database.getDb();
        const { userId } = req.params;
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        console.log('User found:', user);
        res.json({ 
            success: true, 
            user: user 
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router; 