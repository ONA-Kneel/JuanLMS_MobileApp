import express from 'express';
import database from '../connect.cjs';

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
        const result = await db.collection('Classes').insertOne(newClass);
        res.status(201).json({ success: true, class: newClass, insertedId: result.insertedId });
    } catch (err) {
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
        const classes = await db.collection('Classes')
            .find({ 
                "members": { $elemMatch: { $eq: studentID } }
            })
            .toArray();

        console.log('Found classes:', classes);

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

export default router; 