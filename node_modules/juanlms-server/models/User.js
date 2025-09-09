import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  role: String,
  profilePicture: String,
  // Common identifiers used across the app
  userID: { type: String },
  schoolID: { type: String },
  // any other fields
});

export default mongoose.model("User", userSchema);