import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  joinCode: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique join code
groupChatSchema.pre('save', function(next) {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("GroupChat", groupChatSchema); 