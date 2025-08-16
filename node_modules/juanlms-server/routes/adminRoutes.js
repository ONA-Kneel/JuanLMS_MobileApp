import e from "express";
import database from "../connect.cjs";
import { ObjectId } from "mongodb";
import moment from 'moment';

const adminRoutes = e.Router();

// Get user statistics (counts by role)
adminRoutes.get("/api/admin/user-stats", async (req, res) => {
    try {
        const db = database.getDb();
        
        // Count users by role
        const admins = await db.collection("users").countDocuments({ role: "admin" });
        const faculty = await db.collection("users").countDocuments({ role: "faculty" });
        const students = await db.collection("users").countDocuments({ role: "students" });
        
        res.json({
            admins,
            faculty,
            students,
            total: admins + faculty + students
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});

// Get recent login history
adminRoutes.get("/api/admin/recent-logins", async (req, res) => {
    try {
        const db = database.getDb();
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent login records from audit trail
        const recentLogins = await db.collection("auditLogs")
            .find({ action: "Login" })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        
        // Format the response
        const formattedLogins = recentLogins.map(login => ({
            userName: login.userName,
            role: login.userRole,
            lastLogin: login.timestamp
        }));
        
        res.json(formattedLogins);
    } catch (error) {
        console.error('Error fetching recent logins:', error);
        res.status(500).json({ error: 'Failed to fetch recent logins' });
    }
});

// Get audit trail preview
adminRoutes.get("/api/admin/audit-preview", async (req, res) => {
    try {
        const db = database.getDb();
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent audit logs
        const auditLogs = await db.collection("auditLogs")
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        
        // Format the response
        const formattedLogs = auditLogs.map(log => ({
            timestamp: log.timestamp,
            userName: log.userName,
            action: log.action
        }));
        
        res.json(formattedLogs);
    } catch (error) {
        console.error('Error fetching audit preview:', error);
        res.status(500).json({ error: 'Failed to fetch audit preview' });
    }
});

// Get active users today
adminRoutes.get("/api/admin/active-users-today", async (req, res) => {
    try {
        const db = database.getDb();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        // Count users who logged in today
        const activeUsers = await db.collection("auditLogs")
            .countDocuments({
                action: "Login",
                timestamp: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        
        res.json({ activeUsers });
    } catch (error) {
        console.error('Error fetching active users:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
});

// Get academic year progress
adminRoutes.get("/admin/academic-progress", async (req, res) => {
    try {
        const now = new Date();
        
        // Academic year dates (configurable)
        const schoolYearStart = new Date('2025-06-01');
        const schoolYearEnd = new Date('2026-04-30');
        const termStart = new Date('2025-08-02');
        const termEnd = new Date('2025-08-03');
        
        // Calculate progress percentages
        const schoolYearTotal = schoolYearEnd - schoolYearStart;
        const schoolYearElapsed = Math.max(0, now - schoolYearStart);
        const schoolYearProgress = Math.min(100, (schoolYearElapsed / schoolYearTotal) * 100);
        
        const termTotal = termEnd - termStart;
        const termElapsed = Math.max(0, now - termStart);
        const termProgress = Math.min(100, (termElapsed / termTotal) * 100);
        
        res.json({
            schoolYear: {
                progress: Math.round(schoolYearProgress),
                startDate: schoolYearStart,
                endDate: schoolYearEnd
            },
            term: {
                progress: Math.round(termProgress),
                startDate: termStart,
                endDate: termEnd
            }
        });
    } catch (error) {
        console.error('Error calculating academic progress:', error);
        res.status(500).json({ error: 'Failed to calculate academic progress' });
    }
});

// Get academic calendar events
adminRoutes.get("/admin/academic-calendar", async (req, res) => {
    try {
        const db = database.getDb();
        const { month, year } = req.query;
        
        const startDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
        const endDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);
        
        // Get calendar events for the month
        const events = await db.collection("calendarEvents")
            .find({
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .toArray();
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching academic calendar:', error);
        res.status(500).json({ error: 'Failed to fetch academic calendar' });
    }
});

// Create audit log entry
adminRoutes.post("/admin/audit-log", async (req, res) => {
    try {
        const db = database.getDb();
        const { userName, userRole, action, details } = req.body;
        
        const auditEntry = {
            timestamp: new Date(),
            userName,
            userRole,
            action,
            details: details || '',
            ipAddress: req.ip || req.connection.remoteAddress
        };
        
        const result = await db.collection("auditLogs").insertOne(auditEntry);
        res.json(result);
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ error: 'Failed to create audit log' });
    }
});

// Get dashboard summary
adminRoutes.get("/api/admin/dashboard-summary", async (req, res) => {
    try {
        const db = database.getDb();
        
        // Get all statistics in parallel
        const [userStats, recentLogins, auditPreview, activeUsers, academicProgress] = await Promise.all([
            // User statistics
            (async () => {
                const admins = await db.collection("users").countDocuments({ role: "admin" });
                const faculty = await db.collection("users").countDocuments({ role: "faculty" });
                const students = await db.collection("users").countDocuments({ role: "students" });
                return { admins, faculty, students };
            })(),
            
            // Recent logins
            (async () => {
                const logins = await db.collection("auditLogs")
                    .find({ action: "Login" })
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .toArray();
                return logins.map(login => ({
                    userName: login.userName,
                    role: login.userRole,
                    lastLogin: login.timestamp
                }));
            })(),
            
            // Audit preview
            (async () => {
                const logs = await db.collection("auditLogs")
                    .find({})
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .toArray();
                return logs.map(log => ({
                    timestamp: log.timestamp,
                    userName: log.userName,
                    action: log.action
                }));
            })(),
            
            // Active users today
            (async () => {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                
                return await db.collection("auditLogs")
                    .countDocuments({
                        action: "Login",
                        timestamp: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    });
            })(),
            
            // Academic progress
            (async () => {
                const now = new Date();
                const schoolYearStart = new Date('2025-06-01');
                const schoolYearEnd = new Date('2026-04-30');
                const termStart = new Date('2025-08-02');
                const termEnd = new Date('2025-08-03');
                
                const schoolYearTotal = schoolYearEnd - schoolYearStart;
                const schoolYearElapsed = Math.max(0, now - schoolYearStart);
                const schoolYearProgress = Math.min(100, (schoolYearElapsed / schoolYearTotal) * 100);
                
                const termTotal = termEnd - termStart;
                const termElapsed = Math.max(0, now - termStart);
                const termProgress = Math.min(100, (termElapsed / termTotal) * 100);
                
                return {
                    schoolYear: Math.round(schoolYearProgress),
                    term: Math.round(termProgress)
                };
            })()
        ]);
        
        res.json({
            userStats,
            recentLogins,
            auditPreview,
            activeUsers,
            academicProgress
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
});

export default adminRoutes; 