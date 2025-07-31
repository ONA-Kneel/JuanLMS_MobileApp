import { ObjectId } from 'mongodb';

// Message subdocument structure
export const messageSchema = {
  sender: String, // 'user' or 'admin'
  senderId: String,
  message: String,
  timestamp: { type: Date, default: () => new Date() }
};

// Ticket document structure
export const ticketSchema = {
  userId: String,
  subject: String,
  description: String,
  status: { type: String, default: 'new' }, // 'new', 'opened', 'closed'
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  messages: [messageSchema]
}; 