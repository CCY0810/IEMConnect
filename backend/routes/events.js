import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFile,
  registerForEvent,
  unregisterFromEvent,
  getEventParticipants,
  startEvent,
  endEvent,
} from "../controllers/eventController.js";
import { sendEventAnnouncement } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/admin.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Serve uploaded files (publicly accessible - no auth required)
// Images need to be fetchable by browsers without auth headers
// This MUST come before the verifyToken middleware
router.get("/files/:filename", getFile);

// All other event routes require authentication
router.use(verifyToken);

// Get all events (accessible to all authenticated users)
router.get("/", getEvents);

// Get single event by ID (accessible to all authenticated users)
router.get("/:id", getEventById);

// Register for an event (authenticated users)
router.post("/:id/register", registerForEvent);

// Unregister from an event (authenticated users)
router.delete("/:id/unregister", unregisterFromEvent);

// Get participants for an event (admin only)
router.get("/:id/participants", verifyAdmin, getEventParticipants);

// Send announcement to event participants (admin only)
router.post("/:id/announce", verifyAdmin, sendEventAnnouncement);

// Start event - change status from Upcoming to Open (admin only)
router.post("/:id/start", verifyAdmin, startEvent);

// End event - change status from Open to Completed (admin only)
router.post("/:id/end", verifyAdmin, endEvent);

// Create event (admin only)
router.post(
  "/",
  verifyAdmin,
  upload.fields([
    { name: "poster_file", maxCount: 1 },
    { name: "paperwork_file", maxCount: 1 },
  ]),
  createEvent
);

// Update event (admin only)
router.put(
  "/:id",
  verifyAdmin,
  upload.fields([
    { name: "poster_file", maxCount: 1 },
    { name: "paperwork_file", maxCount: 1 },
  ]),
  updateEvent
);

// Delete event (admin only)
router.delete("/:id", verifyAdmin, deleteEvent);

export default router;
