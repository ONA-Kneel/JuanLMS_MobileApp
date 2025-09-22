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
  // Device tokens for push notifications (FCM)
  deviceTokens: { type: [String], default: [] },
  // any other fields
});

export default mongoose.model("User", userSchema);