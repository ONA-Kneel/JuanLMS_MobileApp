import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  role: String,
  profilePicture: String,
  // any other fields
});

export default mongoose.model("User", userSchema);