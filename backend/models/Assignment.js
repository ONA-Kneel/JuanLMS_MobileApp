import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema({
  classID: { type: String, required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Changed to false
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  points: { type: Number },
  type: { type: String, enum: ['assignment', 'quiz'], default: 'assignment' },
  description: { type: String },
  fileUploadRequired: { type: Boolean },
  allowedFileTypes: { type: String },
  fileInstructions: { type: String },
  questions: { type: Array },
  status: { type: String, enum: ['upcoming', 'past-due', 'completed'], default: 'upcoming' },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedTo: [{
    classID: String,
    studentIDs: [String]
  }],
  attachmentLink: { type: String },
  attachmentFile: { type: String },
  postAt: { type: Date }
});
export default mongoose.model("Assignment", assignmentSchema, "Assignments"); 