import express from "express";
import { generateCertificate } from "../controllers/certificateController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Generate certificate for a specific event
router.get("/events/:eventId/certificate", verifyToken, generateCertificate);

export default router;

