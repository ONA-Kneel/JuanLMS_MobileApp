import mongoose from "mongoose";

const PostedGradesSchema = new mongoose.Schema({
  classId: { type: String, required: true },
  section: { type: String, required: true },
  quarter: { type: String, required: true, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
  grades: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quarterlyGrade: { type: Number, min: 0, max: 100 },
    termFinalGrade: { type: Number, min: 0, max: 100 },
    remarks: { 
      type: String, 
      enum: ['PASSED', 'FAILED', 'REPEAT', 'INCOMPLETE'], 
      default: 'INCOMPLETE' 
    }
  }],
  postedAt: { type: Date, default: Date.now },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  academicYear: { type: String, required: true },
  termName: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('PostedGrades', PostedGradesSchema);
