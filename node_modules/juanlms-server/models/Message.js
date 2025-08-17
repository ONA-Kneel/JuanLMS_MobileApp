import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

// Add middleware to log timestamp information
messageSchema.pre('save', function(next) {
  console.log('Saving message with timestamp:', this.timestamp, 'Type:', typeof this.timestamp);
  next();
});

export default mongoose.model("Message", messageSchema);