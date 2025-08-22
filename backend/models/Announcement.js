import mongoose from "mongoose";
const announcementSchema = new mongoose.Schema({
  classID: { type: String, required: false }, // Made optional for general announcements
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, enum: ['general', 'academic', 'administrative', 'faculty', 'student'], default: 'general' },
  targetAudience: { type: [String], default: ['everyone'] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Announcement", announcementSchema, "Announcements"); 