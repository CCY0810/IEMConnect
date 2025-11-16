import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Placeholder for getting all notifications
router.get("/", (req, res) => {
  res.json({
    message: "Notifications endpoint - Coming soon",
    notifications: [],
  });
});

// Placeholder for creating a notification (admin only)
router.post("/", verifyAdmin, (req, res) => {
  res.json({
    message: "Create notification endpoint - Coming soon",
  });
});

// Placeholder for marking notification as read
router.put("/:id/read", (req, res) => {
  res.json({
    message: "Mark notification read endpoint - Coming soon",
    id: req.params.id,
  });
});

export default router;
