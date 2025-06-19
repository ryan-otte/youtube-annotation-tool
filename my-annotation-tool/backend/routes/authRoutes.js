import express from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser,
  requestPasswordReset,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser); // ✅ Check logged-in user

// Password reset routes
router.post("/reset-password-request", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
