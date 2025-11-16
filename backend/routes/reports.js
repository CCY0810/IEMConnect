import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Placeholder for reports list
router.get("/", verifyAdmin, (req, res) => {
  res.json({
    message: "Reports endpoint - Coming soon",
    reports: [],
  });
});

// Placeholder for generating a report
router.post("/generate", verifyAdmin, (req, res) => {
  res.json({
    message: "Report generation endpoint - Coming soon",
  });
});

export default router;
