import mongoose from "mongoose";
const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{
    url: String,
    name: String,
    originalName: String,
    uploadedAt: { type: Date, default: Date.now },
    isReplacement: { type: Boolean, default: false },
    replacementTime: Date,
    isLate: { type: Boolean, default: false },
    fileSize: Number,
    mimetype: String
  }],
  context: { type: String }, // Add text submission support
  fileUrl: { type: String }, // legacy, keep for backward compatibility
  fileName: { type: String }, // legacy, keep for backward compatibility
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['turned-in', 'graded'], default: 'turned-in' },
  grade: { type: Number },
  feedback: { type: String },
  // Enhanced resubmission tracking
  hasReplacement: { type: Boolean, default: false },
  replacementCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  originalSubmissionDate: { type: Date, default: Date.now }
});
export default mongoose.model("Submission", submissionSchema); 