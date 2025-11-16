import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Placeholder for attendance list
router.get("/", verifyAdmin, (req, res) => {
  res.json({
    message: "Attendance endpoint - Coming soon",
    attendance: [],
  });
});

// Placeholder for marking attendance
router.post("/mark", verifyAdmin, (req, res) => {
  res.json({
    message: "Mark attendance endpoint - Coming soon",
  });
});

// Placeholder for getting attendance by event
router.get("/event/:eventId", verifyAdmin, (req, res) => {
  res.json({
    message: "Event attendance endpoint - Coming soon",
    eventId: req.params.eventId,
    attendance: [],
  });
});

export default router;
