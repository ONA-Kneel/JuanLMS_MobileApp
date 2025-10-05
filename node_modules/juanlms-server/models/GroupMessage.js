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
  }, // Keep existing for backward compatibility
  attachments: [{ // New field for multiple files
    url: String,
    name: String,
    fileType: String, // 'image' or 'document'
    thumbnailUrl: String, // For images
    size: Number,
    width: Number, // For images
    height: Number // For images
  }],
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