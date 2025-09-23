import admin from 'firebase-admin';
import User from '../models/User.js';

// Initialize Firebase Admin SDK once
let isInitialized = false;
function initFirebaseAdmin() {
  if (isInitialized) return;

  try {
    // Option 1: JSON string in env (FIREBASE_SERVICE_ACCOUNT)
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svcJson) {
      const credentials = JSON.parse(svcJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      isInitialized = true;
      return;
    }

    // Option 2: GOOGLE_APPLICATION_CREDENTIALS pointing to JSON file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      isInitialized = true;
      return;
    }

    // Option 3: Fallback to env key pair (not recommended, but supported)
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (clientEmail && privateKey && projectId) {
      admin.initializeApp({
        credential: admin.credential.cert({
          client_email: clientEmail,
          private_key: privateKey,
          project_id: projectId,
        }),
      });
      isInitialized = true;
      return;
    }

    console.warn('[FCM] Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.');
  } catch (error) {
    console.error('[FCM] Initialization error:', error);
  }
}

initFirebaseAdmin();

/**
 * Send an FCM notification to a list of users by their Mongo _id strings.
 * Automatically cleans up invalid tokens.
 * @param {string[]} userIds
 * @param {{ title: string, body: string }} notification
 * @param {Record<string,string>} data
 */
export async function sendNotificationToUsers(userIds, notification, data = {}) {
  try {
    if (!isInitialized) {
      console.warn('[FCM] Skipping send: Firebase Admin not initialized');
      return { successCount: 0, failureCount: 0 };
    }

    const users = await User.find({ _id: { $in: userIds } }, 'deviceTokens');
    const tokens = users
      .flatMap(u => Array.isArray(u.deviceTokens) ? u.deviceTokens : [])
      .filter(Boolean);

    if (tokens.length === 0) {
      console.warn('[FCM] No tokens found for users:', userIds);
      return { successCount: 0, failureCount: 0 };
    }

    console.log(`[FCM] Token lookup: users=${userIds.length} totalTokens=${tokens.length}`);

    console.log(`[FCM] Sending to ${tokens.length} tokens for users:`, userIds);
    const message = {
      tokens,
      notification,
      data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, v == null ? '' : String(v)])),
      android: {
        priority: 'high',
        notification: { channelId: 'default', sound: 'default' },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Send result: success=${response.successCount}, failure=${response.failureCount}`);

    // Cleanup invalid tokens
    const invalidTokens = new Set();
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code || '';
        if (
          errCode.includes('messaging/invalid-registration-token') ||
          errCode.includes('messaging/registration-token-not-registered')
        ) {
          invalidTokens.add(tokens[idx]);
        }
        console.warn('[FCM] Token send failed:', tokens[idx], resp.error?.code, resp.error?.message);
      }
    });

    if (invalidTokens.size > 0) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { deviceTokens: { $in: Array.from(invalidTokens) } } }
      );
      console.log('[FCM] Removed invalid tokens:', Array.from(invalidTokens));
    }

    return { successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('[FCM] sendNotificationToUsers error:', error);
    return { successCount: 0, failureCount: 0 };
  }
}

/**
 * Convenience for a single user id.
 */
export async function sendNotificationToUser(userId, notification, data = {}) {
  return sendNotificationToUsers([userId], notification, data);
}


