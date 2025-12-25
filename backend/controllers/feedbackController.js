import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import User from "../models/User.js";
import { Op, Sequelize } from "sequelize";
import Joi from "joi";

/**
 * Feedback Controller
 * Handles all feedback-related operations including submission,
 * eligibility checks, and admin reporting.
 */

// ============================================
// Validation Schemas
// ============================================

const submitFeedbackSchema = Joi.object({
  event_id: Joi.number().integer().positive().required().messages({
    "number.base": "Event ID must be a number",
    "any.required": "Event ID is required",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "any.required": "Rating is required",
  }),
  comment: Joi.string().max(2000).allow("", null).optional().messages({
    "string.max": "Comment must be less than 2000 characters",
  }),
});

// ============================================
// User Endpoints
// ============================================

/**
 * Submit feedback for an event
 * POST /api/v1/feedback
 * 
 * Validates that:
 * 1. Event exists and is completed
 * 2. User has attended the event
 * 3. User has not already submitted feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const { error, value } = submitFeedbackSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ error: errorMessages });
    }

    const { event_id, rating, comment } = value;

    // Check if event exists
    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event is completed
    if (event.status !== "Completed") {
      return res.status(400).json({
        error: "Feedback can only be submitted for completed events",
      });
    }

    // Check if user attended this event
    const registration = await EventRegistration.findOne({
      where: {
        user_id: userId,
        event_id: event_id,
        status: "attended",
      },
    });

    if (!registration) {
      return res.status(403).json({
        error: "You must have attended this event to submit feedback",
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      where: {
        user_id: userId,
        event_id: event_id,
      },
    });

    if (existingFeedback) {
      return res.status(409).json({
        error: "You have already submitted feedback for this event",
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      user_id: userId,
      event_id: event_id,
      rating,
      comment: comment || null,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        id: feedback.id,
        user_id: feedback.user_id,
        event_id: feedback.event_id,
        rating: feedback.rating,
        comment: feedback.comment,
        created_at: feedback.created_at,
      },
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      error: "Failed to submit feedback",
      details: error.message,
    });
  }
};

/**
 * Get current user's feedback history
 * GET /api/v1/feedback/my-feedback
 */
export const getMyFeedback = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedback = await Feedback.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "start_date", "end_date", "status"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      feedback: feedback.map((f) => ({
        id: f.id,
        event_id: f.event_id,
        event_title: f.event?.title || "Unknown Event",
        event_date: f.event?.start_date,
        rating: f.rating,
        comment: f.comment,
        created_at: f.created_at,
      })),
    });
  } catch (error) {
    console.error("Get my feedback error:", error);
    res.status(500).json({
      error: "Failed to fetch feedback history",
      details: error.message,
    });
  }
};

/**
 * Check if user can submit feedback for an event
 * GET /api/v1/feedback/can-submit/:eventId
 */
export const canSubmitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.eventId);

    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.json({
        can_submit: false,
        reason: "Event not found",
      });
    }

    // Check if event is completed
    if (event.status !== "Completed") {
      return res.json({
        can_submit: false,
        reason: "Feedback can only be submitted for completed events",
      });
    }

    // Check if user attended
    const registration = await EventRegistration.findOne({
      where: {
        user_id: userId,
        event_id: eventId,
        status: "attended",
      },
    });

    if (!registration) {
      return res.json({
        can_submit: false,
        reason: "You must have attended this event to submit feedback",
      });
    }

    // Check if already submitted
    const existingFeedback = await Feedback.findOne({
      where: {
        user_id: userId,
        event_id: eventId,
      },
    });

    if (existingFeedback) {
      return res.json({
        can_submit: false,
        reason: "You have already submitted feedback for this event",
        feedback_id: existingFeedback.id,
      });
    }

    res.json({
      can_submit: true,
      reason: null,
    });
  } catch (error) {
    console.error("Can submit feedback error:", error);
    res.status(500).json({
      error: "Failed to check feedback eligibility",
      details: error.message,
    });
  }
};

// ============================================
// Admin Endpoints
// ============================================

/**
 * Get all feedback for a specific event (Admin only)
 * GET /api/v1/feedback/event/:eventId
 */
export const getEventFeedback = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event details
    const event = await Event.findByPk(eventId, {
      attributes: ["id", "title", "start_date", "end_date", "status"],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all feedback for this event
    const feedback = await Feedback.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "faculty"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageRating =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((f) => {
      ratingDistribution[f.rating]++;
    });

    res.json({
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
      },
      stats: {
        total_feedback: totalFeedback,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution,
      },
      feedback: feedback.map((f) => ({
        id: f.id,
        user_id: f.user?.id,
        user_name: f.user?.name || "Anonymous",
        user_email: f.user?.email,
        user_faculty: f.user?.faculty,
        rating: f.rating,
        comment: f.comment,
        created_at: f.created_at,
      })),
    });
  } catch (error) {
    console.error("Get event feedback error:", error);
    res.status(500).json({
      error: "Failed to fetch event feedback",
      details: error.message,
    });
  }
};

/**
 * Get feedback summary/reports (Admin only)
 * GET /api/v1/feedback/reports/summary
 * Query params: start_date, end_date
 */
export const getFeedbackSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build date filter
    const dateFilter = {};
    if (start_date) {
      dateFilter[Op.gte] = new Date(start_date);
    }
    if (end_date) {
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter[Op.lte] = endDateObj;
    }

    const whereClause =
      Object.keys(dateFilter).length > 0
        ? { created_at: dateFilter }
        : {};

    // Get all feedback
    const allFeedback = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate overall statistics
    const totalFeedback = allFeedback.length;
    const overallAverageRating =
      totalFeedback > 0
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

    // Overall rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allFeedback.forEach((f) => {
      ratingDistribution[f.rating]++;
    });

    // Group by event for top rated events
    const eventStats = {};
    allFeedback.forEach((f) => {
      const eventId = f.event_id;
      if (!eventStats[eventId]) {
        eventStats[eventId] = {
          event_id: eventId,
          title: f.event?.title || "Unknown Event",
          total_rating: 0,
          count: 0,
        };
      }
      eventStats[eventId].total_rating += f.rating;
      eventStats[eventId].count++;
    });

    // Calculate average and sort by rating
    const topRatedEvents = Object.values(eventStats)
      .map((e) => ({
        event_id: e.event_id,
        title: e.title,
        avg_rating: Math.round((e.total_rating / e.count) * 10) / 10,
        count: e.count,
      }))
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 10);

    // Recent feedback (last 10)
    const recentFeedback = allFeedback.slice(0, 10).map((f) => ({
      id: f.id,
      event_id: f.event_id,
      event_title: f.event?.title || "Unknown Event",
      user_name: f.user?.name || "Anonymous",
      rating: f.rating,
      comment: f.comment,
      created_at: f.created_at,
    }));

    res.json({
      total_feedback: totalFeedback,
      overall_average_rating: Math.round(overallAverageRating * 10) / 10,
      events_with_feedback: Object.keys(eventStats).length,
      rating_distribution: ratingDistribution,
      top_rated_events: topRatedEvents,
      recent_feedback: recentFeedback,
    });
  } catch (error) {
    console.error("Get feedback summary error:", error);
    res.status(500).json({
      error: "Failed to fetch feedback summary",
      details: error.message,
    });
  }
};

/**
 * Export feedback for an event as CSV (Admin only)
 * GET /api/v1/feedback/export/:eventId
 */
export const exportFeedback = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event details
    const event = await Event.findByPk(eventId, {
      attributes: ["id", "title"],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all feedback for this event
    const feedback = await Feedback.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email", "faculty", "matric_number"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Generate CSV content
    const headers = [
      "No",
      "Name",
      "Email",
      "Matric Number",
      "Faculty",
      "Rating",
      "Comment",
      "Submitted At",
    ];

    const rows = feedback.map((f, index) => [
      index + 1,
      f.user?.name || "Anonymous",
      f.user?.email || "",
      f.user?.matric_number || "",
      f.user?.faculty || "",
      f.rating,
      `"${(f.comment || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
      new Date(f.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Set response headers for CSV download
    const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `feedback_${safeTitle}_${eventId}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Export feedback error:", error);
    res.status(500).json({
      error: "Failed to export feedback",
      details: error.message,
    });
  }
};

/**
 * Get all events with their feedback stats (Admin only)
 * GET /api/v1/feedback/events-with-feedback
 */
export const getEventsWithFeedback = async (req, res) => {
  try {
    // Get all completed events with feedback counts
    const events = await Event.findAll({
      where: { status: "Completed" },
      attributes: ["id", "title", "start_date", "end_date"],
      order: [["start_date", "DESC"]],
    });

    // Get feedback stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const feedbackStats = await Feedback.findAll({
          where: { event_id: event.id },
          attributes: [
            [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            [Sequelize.fn("AVG", Sequelize.col("rating")), "avg_rating"],
          ],
          raw: true,
        });

        const stats = feedbackStats[0] || { count: 0, avg_rating: null };

        return {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          feedback_count: parseInt(stats.count) || 0,
          average_rating: stats.avg_rating
            ? Math.round(parseFloat(stats.avg_rating) * 10) / 10
            : null,
        };
      })
    );

    res.json({
      events: eventsWithStats,
    });
  } catch (error) {
    console.error("Get events with feedback error:", error);
    res.status(500).json({
      error: "Failed to fetch events with feedback",
      details: error.message,
    });
  }
};
