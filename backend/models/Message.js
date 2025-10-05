import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  message: String,
  fileUrl: { type: String, default: null }, // Keep existing for backward compatibility
  attachments: [{ // New field for multiple files
    url: String,
    name: String,
    fileType: String, // 'image' or 'document'
    thumbnailUrl: String, // For images
    size: Number,
    width: Number, // For images
    height: Number // For images
  }],
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

export default mongoose.model("Message", messageSchema);