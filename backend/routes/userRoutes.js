import e from "express";
import database from "../connect.cjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const userRoutes = e.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here"; // 👈 use env variable in production

// ------------------ CRUD ROUTES ------------------

// Retrieve ALL
userRoutes.get("/users", async (req, res) => {
    const db = database.getDb();
    const data = await db.collection("users").find({}).toArray();
    if (data.length > 0) {
        res.json(data);
    } else {
        throw new Error("Data was not found >:(");
    }
});

// Retrieve ONE
userRoutes.get("/users/:id", async (req, res) => {
    const db = database.getDb();
    const data = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    if (data) {
        if (data.email) {
            data.email = decrypt(data.email, process.env.ENCRYPTION_KEY);
        }
        if (data.profilePic) {
            data.profilePic = decrypt(data.profilePic, process.env.ENCRYPTION_KEY);
        }
        res.json(data);
    } else {
        throw new Error("Data was not found >:(");
    }
});

// Create ONE
userRoutes.post("/users", async (req, res) => {
    const db = database.getDb();
    const email = req.body.email.toLowerCase();
    const mongoObject = {
        firstname: req.body.firstname,
        middlename: req.body.middlename,
        lastname: req.body.lastname,
        email: encrypt(email, process.env.ENCRYPTION_KEY),
        emailHash: hashEmail(email),
        contactno: req.body.contactno,
        password: req.body.password, // 🔐 optionally hash this
    };
    const result = await db.collection("users").insertOne(mongoObject);
    res.json(result);
});

// Update ONE
userRoutes.post("/users/:id", async (req, res) => {
    const db = database.getDb();
    const email = req.body.email.toLowerCase();
    const updateObject = {
        $set: {
            firstname: req.body.firstname,
            middlename: req.body.middlename,
            lastname: req.body.lastname,
            email: encrypt(email, process.env.ENCRYPTION_KEY),
            emailHash: hashEmail(email),
            contactno: req.body.contactno,
            password: req.body.password,
        },
    };
    const result = await db.collection("users").updateOne({ _id: new ObjectId(req.params.id) }, updateObject);
    res.json(result);
});

// Delete ONE
userRoutes.delete("/users/:id", async (req, res) => {
    const db = database.getDb();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
});

// Upload profile picture route
userRoutes.post("/users/:id/profile-picture", upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        
        const db = database.getDb();
        const profilePicUrl = `/uploads/profile-pictures/${req.file.filename}`;
        // Encrypt the profilePic path before saving
        const encryptedProfilePic = encrypt(profilePicUrl, process.env.ENCRYPTION_KEY);
        
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { profilePic: encryptedProfilePic } }
        );
        
        if (result.matchedCount === 0) {
            // Delete the uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Profile picture updated successfully",
            profile_picture: profilePicUrl // send decrypted path for immediate frontend use
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        // Delete the uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Failed to upload profile picture" });
    }
});

// PUT profile picture route for RESTful update
userRoutes.put("/users/:id/profile-picture", upload.single('profilePicture'), async (req, res) => {
    try {
        console.log('req.headers:', req.headers); // Debug log
        console.log('req.body:', req.body); // Debug log
        console.log('req.file:', req.file); // Debug log
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const db = database.getDb();
        const profilePicUrl = `/uploads/profile-pictures/${req.file.filename}`;
        // Encrypt the profilePic path before saving
        const encryptedProfilePic = encrypt(profilePicUrl, process.env.ENCRYPTION_KEY);
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { profilePic: encryptedProfilePic } }
        );
        if (result.matchedCount === 0) {
            // Delete the uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ 
            success: true, 
            message: "Profile picture updated successfully",
            profile_picture: profilePicUrl // send decrypted path for immediate frontend use
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        // Delete the uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Failed to upload profile picture" });
    }
});

// Update profile route
userRoutes.post("/users/:id/profile", async (req, res) => {
    try {
        const db = database.getDb();
        const { firstname, lastname, college } = req.body;
        
        const updateObject = {
            $set: {
                firstname,
                lastname,
                college,
            },
        };
        
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(req.params.id) },
            updateObject
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
        if (updatedUser && updatedUser.profilePic) {
            updatedUser.profilePic = decrypt(updatedUser.profilePic, process.env.ENCRYPTION_KEY);
        }
        if (updatedUser && updatedUser.email) {
            updatedUser.email = decrypt(updatedUser.email, process.env.ENCRYPTION_KEY);
        }
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
});

// ------------------ JWT LOGIN ROUTE ------------------

userRoutes.post('/login', async (req, res) => {
    try {
        const db = database.getDb();
        const email = req.body.email?.toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Logging for debugging
        console.log('Login attempt:', email);

        // Hash the incoming email to match the hash in the DB
        const emailHash = hashEmail(email);
        const user = await db.collection("users").findOne({ emailHash });
        console.log('User found:', user ? user.email : 'none');
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password match:', isMatch);
            if (isMatch) {
                const firstName = toProperCase(user.firstname);
                const middleInitial = user.middlename ? toProperCase(user.middlename.charAt(0)) + '.' : '';
                const lastName = toProperCase(user.lastname);
                const fullName = [firstName, middleInitial, lastName].filter(Boolean).join(' ');
                const role = getRoleFromEmail(email);

                // Decrypt email before sending to frontend
                const decryptedEmail = decrypt(user.email, process.env.ENCRYPTION_KEY);
                let decryptedProfilePic = null;
                if (user.profilePic) {
                    decryptedProfilePic = decrypt(user.profilePic, process.env.ENCRYPTION_KEY);
                }

                // ✅ JWT Token Payload
                const token = jwt.sign({
                    id: user._id,
                    name: fullName,
                    email: decryptedEmail, // Always return the real email
                    phone: user.contactno,
                    role: role,
                    profilePic: decryptedProfilePic,
                }, JWT_SECRET, { expiresIn: '1d' });

                return res.json({ token }); // ✅ frontend will decode this
            } else {
                return res.status(401).json({ success: false, message: "Invalid email or password" });
            }
        } else {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});

// ------------------ UTILS ------------------

function getRoleFromEmail(email) {
    const normalized = email.toLowerCase();
    if (normalized.endsWith('@students.sjddef.edu.ph')) return 'student';
    if (normalized.endsWith('@parent.sjddef.edu.ph')) return 'parent';
    if (normalized.endsWith('@admin.sjddef.edu.ph')) return 'admin';
    if (normalized.endsWith('@director.sjddef.edu.ph')) return 'director';
    if (normalized.endsWith('@sjddef.edu.ph')) return 'faculty';
    return 'unknown';
}

function toProperCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// AES-256-CBC decrypt function
function decrypt(text, key) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// AES-256-CBC encrypt function
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Deterministic hash for email lookup
function hashEmail(email) {
    return crypto.createHash('sha256').update(email).digest('hex');
}

export default userRoutes;