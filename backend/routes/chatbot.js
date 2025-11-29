import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { handleChatbotMessage } from "../controllers/chatbotController.js";

const router = express.Router();

// All chatbot routes require authentication
router.use(verifyToken);

// POST /api/v1/chatbot/message - Send a message to IEM Assist
router.post("/message", handleChatbotMessage);

export default router;

