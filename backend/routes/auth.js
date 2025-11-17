import express from "express";
import {
  register,
  login,
  verify2FA,
  logout,
  verifySession,
  resend2FA,
  getUnverifiedUsers,
  verifyUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authController.js";
import { verifyTempToken, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-2fa", verifyTempToken, verify2FA);
router.post("/logout", verifyToken, logout);
router.get("/verify-session", verifyToken, verifySession);
router.post("/resend-2fa", verifyTempToken, resend2FA);

// Admin approval routes
router.get("/unverified-users", verifyToken, getUnverifiedUsers);
router.post("/verify-user", verifyToken, verifyUser);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile update route
router.put("/profile", verifyToken, updateProfile);

// Change password route
router.put("/change-password", verifyToken, changePassword);

// Delete account route
router.delete("/account", verifyToken, deleteAccount);

export default router;
