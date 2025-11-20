import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all notifications for logged-in user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark a specific notification as read
router.put("/:id/read", markAsRead);

// Mark all notifications as read
router.put("/read-all", markAllAsRead);

// Create a notification (admin only)
router.post("/", verifyAdmin, createNotification);

export default router;
