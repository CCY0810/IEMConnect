/**
 * Admin Routes
 * Handles admin-specific endpoints for user and invite management
 */

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createAdminInvite,
  validateInviteToken,
  registerWithInvite,
  promoteToAdmin,
  demoteToMember,
  getAllUsers,
  getPendingInvites,
  revokeInvite,
} from "../controllers/adminController.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/invite/:token", validateInviteToken);
router.post("/register", registerWithInvite);

// Protected routes (admin only)
router.post("/invite", verifyToken, createAdminInvite);
router.get("/invites", verifyToken, getPendingInvites);
router.delete("/invite/:id", verifyToken, revokeInvite);
router.post("/promote", verifyToken, promoteToAdmin);
router.post("/demote", verifyToken, demoteToMember);
router.get("/users", verifyToken, getAllUsers);

export default router;
