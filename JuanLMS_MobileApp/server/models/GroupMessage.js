import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  groupId: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  senderName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("GroupMessage", groupMessageSchema); 