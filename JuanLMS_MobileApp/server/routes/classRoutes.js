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

// Get classes for a specific student
router.get('/student-classes', async (req, res) => {
    try {
        const db = database.getDb();
        const { studentID } = req.query;
        
        console.log('Fetching classes for student:', studentID);
        
        if (!studentID) {
            return res.status(400).json({ success: false, error: 'studentID is required' });
        }

        // Find all classes where the student is a member
        // Try multiple approaches to find the student
        let classes = await db.collection('Classes')
            .find({ 
                "members": { $elemMatch: { $eq: studentID } }
            })
            .toArray();

        // If no classes found, try without $elemMatch (in case members is a simple array)
        if (classes.length === 0) {
            classes = await db.collection('Classes')
                .find({ 
                    "members": studentID
                })
                .toArray();
        }

        // If still no classes found, try with ObjectId conversion
        if (classes.length === 0) {
            try {
                const objectId = new ObjectId(studentID);
                classes = await db.collection('Classes')
                    .find({ 
                        "members": { $elemMatch: { $eq: objectId } }
                    })
                    .toArray();
            } catch (e) {
                console.log('Could not convert to ObjectId:', e.message);
            }
        }

        console.log('Found classes:', classes);
        console.log('Query used:', { "members": { $elemMatch: { $eq: studentID } } });

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