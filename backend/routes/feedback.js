import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";
import {
  submitFeedback,
  getMyFeedback,
  canSubmitFeedback,
  getEventFeedback,
  getFeedbackSummary,
  exportFeedback,
  getEventsWithFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ============================================
// User Endpoints
// ============================================

// Submit feedback for an event
router.post("/", submitFeedback);

// Get current user's feedback history
router.get("/my-feedback", getMyFeedback);

// Check if user can submit feedback for an event
router.get("/can-submit/:eventId", canSubmitFeedback);

// ============================================
// Admin Endpoints
// ============================================

// Get all feedback for an event (admin only)
router.get("/event/:eventId", verifyAdmin, getEventFeedback);

// Get feedback summary/reports (admin only)
router.get("/reports/summary", verifyAdmin, getFeedbackSummary);

// Get all events with feedback stats (admin only)
router.get("/events-with-feedback", verifyAdmin, getEventsWithFeedback);

// Export feedback as CSV (admin only)
router.get("/export/:eventId", verifyAdmin, exportFeedback);

export default router;
