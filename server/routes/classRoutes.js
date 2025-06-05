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

export default router; 