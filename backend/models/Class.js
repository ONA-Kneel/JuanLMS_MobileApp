import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  classID: { type: String, required: true, unique: true },
  className: { type: String, required: true },
  classCode: { type: String, required: true },
  classDesc: { type: String, required: true },
  members: [{ type: String, required: true }], // userIDs
  facultyID: { type: String, required: true },
  image: { type: String }, // URL or path to the class image
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed'] }, // Class confirmation status
  confirmedAt: { type: Date }, // When the class was confirmed
  confirmedBy: { type: String }, // Who confirmed the class (facultyID)
});

export default mongoose.model("Class", classSchema, "Classes"); 