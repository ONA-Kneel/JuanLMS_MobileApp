import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  admins: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  joinCode: {
    type: String,
    unique: true,
    sparse: true
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

// Generate unique join code and set creator as admin
groupChatSchema.pre('save', function(next) {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  // Ensure creator is in admins array
  if (this.createdBy && !this.admins.includes(this.createdBy)) {
    this.admins = [this.createdBy, ...this.admins];
  }
  
  // Ensure creator is in participants array
  if (this.createdBy && !this.participants.includes(this.createdBy)) {
    this.participants = [this.createdBy, ...this.participants];
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to check if user is admin
groupChatSchema.methods.isAdmin = function (userId) {
  return this.admins.includes(userId);
};

// Method to check if user is participant
groupChatSchema.methods.isParticipant = function (userId) {
  return this.participants.includes(userId);
};

// Method to add participant
groupChatSchema.methods.addParticipant = function (userId) {
  if (!this.participants.includes(userId) && this.participants.length < this.maxParticipants) {
    this.participants.push(userId);
    return true;
  }
  return false;
};

// Method to remove participant
groupChatSchema.methods.removeParticipant = function (userId) {
  if (this.createdBy === userId) {
    return false; // Creator cannot be removed
  }
  
  const index = this.participants.indexOf(userId);
  if (index > -1) {
    this.participants.splice(index, 1);
    
    // Remove from admins if they were an admin
    const adminIndex = this.admins.indexOf(userId);
    if (adminIndex > -1) {
      this.admins.splice(adminIndex, 1);
    }
    
    return true;
  }
  return false;
};

export default mongoose.model("GroupChat", groupChatSchema); 