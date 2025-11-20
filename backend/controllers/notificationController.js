import Notification from "../models/Notification.js";
import NotificationService from "../services/notificationService.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import { Op } from "sequelize";

/**
 * Get all notifications for the logged-in user
 * GET /api/v1/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unread_count: unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/**
 * Mark a notification as read
 * PUT /api/v1/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.update({ is_read: true });

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read for the logged-in user
 * PUT /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const updated = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    res.json({
      message: "All notifications marked as read",
      updated_count: updated[0],
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({ unread_count: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

/**
 * Send announcement to all event participants (Admin only)
 * POST /api/v1/events/:id/announce
 */
export const sendEventAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message, sendEmail = true } = req.body;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ error: "Subject and message are required" });
    }

    // Get the event
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all registered participants for this event
    const registrations = await EventRegistration.findAll({
      where: {
        event_id: id,
        status: "registered", // Only notify registered participants
      },
      attributes: ["user_id"],
    });

    if (registrations.length === 0) {
      return res.json({
        message: "No registered participants found for this event",
        sent: 0,
      });
    }

    const userIds = registrations.map((reg) => reg.user_id);

    // Send notifications to all participants
    const result = await NotificationService.notifyUsers(
      userIds,
      subject,
      message,
      sendEmail
    );

    res.json({
      message: `Announcement sent to ${result.success} participant(s)`,
      event: {
        id: event.id,
        title: event.title,
      },
      sent: result.success,
      failed: result.failed,
      total: result.total,
    });
  } catch (error) {
    console.error("Send event announcement error:", error);
    res.status(500).json({ error: "Failed to send announcement" });
  }
};

/**
 * Create a notification (Admin only)
 * POST /api/v1/notifications
 */
export const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, sendEmail = false } = req.body;

    if (!user_id || !title || !message) {
      return res
        .status(400)
        .json({ error: "user_id, title, and message are required" });
    }

    const notification = await NotificationService.notifyUser(
      user_id,
      title,
      message,
      sendEmail
    );

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

