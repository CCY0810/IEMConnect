/**
 * Admin Routes
 * Handles admin-specific endpoints for user and invite management
 */

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
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
router.post("/invite", authenticateToken, createAdminInvite);
router.get("/invites", authenticateToken, getPendingInvites);
router.delete("/invite/:id", authenticateToken, revokeInvite);
router.post("/promote", authenticateToken, promoteToAdmin);
router.post("/demote", authenticateToken, demoteToMember);
router.get("/users", authenticateToken, getAllUsers);

export default router;
