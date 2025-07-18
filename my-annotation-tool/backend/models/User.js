import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  resetToken: { type: String, default: undefined },
  resetTokenExpiry: { type: Date, default: undefined }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);