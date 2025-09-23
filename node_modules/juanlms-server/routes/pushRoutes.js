import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sendNotificationToUser, sendNotificationToUsers } from '../services/fcmService.js';

const router = express.Router();

function stringifyValues(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v == null ? '' : String(v)])
  );
}

// POST /api/notify-user
router.post('/notify-user', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body || {};
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
    }

    const notification = { title, body };
    const result = await sendNotificationToUser(userId, notification, {
      ...stringifyValues(data),
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true, result });
  } catch (error) {
    console.error('[Push] /notify-user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notify-users (bulk)
router.post('/notify-users', authenticateToken, async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body || {};
    if (!Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: userIds[], title, body' });
    }

    const notification = { title, body };
    const response = await sendNotificationToUsers(userIds, notification, {
      ...stringifyValues(data),
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true, ...response });
  } catch (error) {
    console.error('[Push] /notify-users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notify-admins-request
router.post('/notify-admins-request', authenticateToken, async (req, res) => {
  try {
    const { userName, userId, requestId, requestType = 'request_submitted' } = req.body || {};
    if (!userName || !userId || !requestId) {
      return res.status(400).json({ error: 'Missing required fields: userName, userId, requestId' });
    }

    const { default: mongoose } = await import('mongoose');
    const db = mongoose.connection.db;
    const admins = await db.collection('accounts').find({ role: { $in: ['admin', 'admin1', 'admin2', 'super-user'] } }).project({ _id: 1 }).toArray();
    const adminIds = admins.map(a => String(a._id));

    const title = requestType === 'reorder_submitted' ? 'New Reorder Request' : 'New Request Submitted';
    const body = requestType === 'reorder_submitted'
      ? `${userName} has submitted a reorder request`
      : `${userName} has submitted a new requisition request`;

    const response = await sendNotificationToUsers(adminIds, { title, body }, stringifyValues({
      type: requestType,
      fromUserId: userId,
      fromUserName: userName,
      screen: 'PendingRequestScreen',
      requestId,
    }));

    return res.json({ success: true, recipients: adminIds.length, ...response });
  } catch (error) {
    console.error('[Push] /notify-admins-request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Optional: lightweight cron trigger endpoints (protect with a simple token)
export function registerCronEndpoints(app) {
  const CRON_TOKEN = process.env.CRON_TOKEN;
  function guard(req, res, next) {
    if (!CRON_TOKEN) return res.status(403).json({ error: 'CRON_TOKEN not set' });
    const token = req.headers['x-cron-token'] || req.query.token;
    if (token !== CRON_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }

  app.post('/api/cron/notify/user', guard, async (req, res) => {
    try {
      const { userId, title, body, data } = req.body || {};
      if (!userId || !title || !body) return res.status(400).json({ error: 'Missing fields' });
      const result = await sendNotificationToUser(userId, { title, body }, stringifyValues(data));
      res.json({ success: true, result });
    } catch (e) {
      console.error('[Cron] notify user error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}


