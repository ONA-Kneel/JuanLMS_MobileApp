import mongoose from 'mongoose';
import { sendNotificationToUser } from './fcmService.js';

let isWatching = false;

export function startNotificationWatcher() {
  if (isWatching) return;
  const db = mongoose.connection?.db;
  if (!db) {
    console.warn('[Watcher] MongoDB not connected yet; cannot start notification watcher.');
    return;
  }

  try {
    const collection = db.collection('Notifications');
    const pipeline = [
      { $match: { operationType: 'insert' } },
    ];

    const changeStream = collection.watch(pipeline, { fullDocument: 'updateLookup' });
    isWatching = true;
    console.log('[Watcher] Started Notifications insert change stream');

    changeStream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
        if (!doc) return;

        const recipientId = String(doc.recipientId || '');
        const title = doc.title || 'Notification';
        const body = doc.message || 'You have a new notification';

        // Optional: include limited metadata for client routing
        const data = {
          type: String(doc.type || 'notification'),
          classID: doc.classID ? String(doc.classID) : '',
          relatedItemId: doc.relatedItemId ? String(doc.relatedItemId) : '',
          priority: String(doc.priority || 'normal'),
          screen: doc.type === 'message' ? 'UnifiedChat' : 'NotificationsScreen',
        };

        // Fire-and-forget; do not block change stream
        sendNotificationToUser(recipientId, { title, body }, data)
          .then((res) => {
            console.log('[Watcher] Push sent for notif', String(doc._id), '->', recipientId, res);
          })
          .catch((err) => {
            console.warn('[Watcher] Push send failed for notif', String(doc._id), err?.message || err);
          });
      } catch (err) {
        console.warn('[Watcher] Change handling error:', err?.message || err);
      }
    });

    changeStream.on('error', (err) => {
      console.error('[Watcher] Change stream error:', err?.message || err);
      isWatching = false;
    });

    changeStream.on('end', () => {
      console.log('[Watcher] Change stream ended');
      isWatching = false;
    });
  } catch (error) {
    console.error('[Watcher] Failed to start notification watcher:', error);
  }
}


