import express from "express";
import {
  register,
  login,
  verify2FA,
  logout,
  logoutAllSessions,
  verifySession,
  resend2FA,
  getUnverifiedUsers,
  verifyUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadAvatar,
  deleteAvatar,
  getAvatar,
} from "../controllers/authController.js";
import {
  getUserPreferences,
  updateUserPreferences,
  get2FAStatus,
  update2FA,
  getActiveSessions,
  logoutSession,
  exportUserData,
  getAdminSystemStats,
} from "../controllers/settingsController.js";
import { verifyTempToken, verifyToken } from "../middleware/auth.js";
import profileUpload from "../middleware/profileUpload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-2fa", verifyTempToken, verify2FA);
router.post("/logout", verifyToken, logout);
router.post("/logout-all", verifyToken, logoutAllSessions);
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

// Avatar routes
router.put(
  "/profile/avatar",
  verifyToken,
  profileUpload.single("avatar"),
  uploadAvatar
);
router.delete("/profile/avatar", verifyToken, deleteAvatar);
router.get("/avatar/:filename", getAvatar);

// Change password route
router.put("/change-password", verifyToken, changePassword);

// Delete account route
router.delete("/account", verifyToken, deleteAccount);

// Settings routes
router.get("/preferences", verifyToken, getUserPreferences);
router.put("/preferences", verifyToken, updateUserPreferences);
router.get("/2fa", verifyToken, get2FAStatus);
router.put("/2fa", verifyToken, update2FA);
router.get("/sessions", verifyToken, getActiveSessions);
router.delete("/sessions/:sessionId", verifyToken, logoutSession);
router.get("/export-data", verifyToken, exportUserData);
router.get("/admin/system-stats", verifyToken, getAdminSystemStats);

export default router;
