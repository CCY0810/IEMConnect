import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";
import { reportsRateLimit } from "../middleware/rateLimiter.js";
import {
  getUsersInsights,
  getEventOperations,
  getAttendanceEngagement,
  getAttendanceByFaculty,
  getRegistrationsVsAttendance,
  getRecentActivity,
  getTopEvents,
} from "../controllers/reportController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Apply rate limiting to all reports endpoints
router.use(reportsRateLimit);

// Placeholder for reports list
// User & Faculty Insights
router.get("/users-insights", verifyAdmin, getUsersInsights);

// Event Operations
router.get("/event-operations", verifyAdmin, getEventOperations);

// Attendance & Engagement
router.get("/attendance-engagement", verifyAdmin, getAttendanceEngagement);

// Charts
router.get("/attendance-by-faculty", verifyAdmin, getAttendanceByFaculty);
router.get(
  "/registrations-vs-attendance",
  verifyAdmin,
  getRegistrationsVsAttendance
);

// Tables
router.get("/recent-activity", verifyAdmin, getRecentActivity);
router.get("/top-events", verifyAdmin, getTopEvents);

export default router;
