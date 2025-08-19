import e from "express";
import database from "../connect.cjs";
import { ObjectId } from "mongodb";

const auditRoutes = e.Router();

// Middleware to check if user has permission to view audit logs
const checkAuditPermission = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // For now, allow all authenticated users to access audit logs
    // In production, you might want to implement proper JWT verification
    // and role-based access control here
    
    next();
  } catch (error) {
    console.error('Error checking audit permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get audit logs with pagination and filtering
auditRoutes.get("/audit-logs", checkAuditPermission, async (req, res) => {
  try {
    const db = database.getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const role = req.query.role;
    
    // Build query based on filters
    let query = {};
    
    if (action && action !== 'all') {
      query.action = action;
    }
    
    if (role && role !== 'all') {
      query.userRole = { $regex: role, $options: 'i' };
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await db.collection("auditLogs").countDocuments(query);
    
    // Get audit logs with pagination
    const logs = await db.collection("auditLogs")
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Format the response to match the expected structure
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      action: log.action || 'Unknown Action',
      details: log.details || 'No details available',
      category: log.category || log.userRole || 'system',
      userRole: log.userRole || 'Unknown Role',
      userName: log.userName || 'Unknown User',
      timestamp: log.timestamp || new Date(),
      ipAddress: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'Mobile App'
    }));
    
    res.json({
      logs: formattedLogs,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for dashboard preview (limited count)
auditRoutes.get("/api/admin/audit-preview", checkAuditPermission, async (req, res) => {
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
      userName: log.userName || 'Unknown User',
      action: log.action || 'Unknown Action'
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching audit preview:', error);
    res.status(500).json({ error: 'Failed to fetch audit preview' });
  }
});

// Get recent login history
auditRoutes.get("/api/admin/recent-logins", checkAuditPermission, async (req, res) => {
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
      userName: login.userName || 'Unknown User',
      role: login.userRole || 'Unknown Role',
      lastLogin: login.timestamp
    }));
    
    res.json(formattedLogins);
  } catch (error) {
    console.error('Error fetching recent logins:', error);
    res.status(500).json({ error: 'Failed to fetch recent logins' });
  }
});

export default auditRoutes;
