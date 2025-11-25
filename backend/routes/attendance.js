import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";
import {
  startAttendance,
  stopAttendance,
  getAttendanceList,
  checkIn,
  canStartEvent,
  getMyAttendedEvents,
} from "../controllers/attendanceController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Student check-in endpoint
router.post("/check-in", checkIn);

// Get user's attended events (for all authenticated users)
router.get("/my-attended-events", getMyAttendedEvents);

// Admin endpoints
router.get("/events/:id/can-start", verifyAdmin, canStartEvent);
router.post("/events/:id/start", verifyAdmin, startAttendance);
router.post("/events/:id/stop", verifyAdmin, stopAttendance);
router.get("/events/:id/list", verifyAdmin, getAttendanceList);

export default router;
