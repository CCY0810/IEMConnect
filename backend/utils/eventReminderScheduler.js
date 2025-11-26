import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import NotificationService from "../services/notificationService.js";
import { Op } from "sequelize";

/**
 * Event Reminder Scheduler
 * Sends notifications to registered users:
 * - 1 day before event starts
 * - 1 hour before event starts
 */
class EventReminderScheduler {
  constructor() {
    this.sentReminders = new Map(); // Track sent reminders to avoid duplicates
    this.isRunning = false;
  }

  /**
   * Get the event start datetime
   */
  getEventStartDateTime(event) {
    const startDate = new Date(event.start_date);
    if (event.start_time) {
      const [hours, minutes] = event.start_time.split(":");
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // Default to 9 AM if no time specified
      startDate.setHours(9, 0, 0, 0);
    }
    return startDate;
  }

  /**
   * Check if reminder should be sent (1 day or 1 hour before)
   */
  shouldSendReminder(event, reminderType) {
    const now = new Date();
    const eventStart = this.getEventStartDateTime(event);
    const diffMs = eventStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Create a unique key for this reminder
    const reminderKey = `${event.id}_${reminderType}`;

    // Check if we've already sent this reminder
    if (this.sentReminders.has(reminderKey)) {
      return false;
    }

    if (reminderType === "1day") {
      // Send reminder if event is between 23-25 hours away
      return diffHours >= 23 && diffHours <= 25;
    } else if (reminderType === "1hour") {
      // Send reminder if event is between 0.5-1.5 hours away
      return diffHours >= 0.5 && diffHours <= 1.5;
    }

    return false;
  }

  /**
   * Send reminder for a specific event
   */
  async sendReminder(event, reminderType) {
    try {
      // Get all registered users for this event
      const registrations = await EventRegistration.findAll({
        where: {
          event_id: event.id,
          status: "registered",
        },
        attributes: ["user_id"],
      });

      if (registrations.length === 0) {
        return { sent: 0, skipped: true };
      }

      const userIds = registrations.map((reg) => reg.user_id);
      const eventStart = this.getEventStartDateTime(event);
      const timeString = eventStart.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const reminderKey = `${event.id}_${reminderType}`;
      let title, message;

      if (reminderType === "1day") {
        title = `Event Reminder: ${event.title}`;
        message = `The event "${event.title}" is starting in 1 day.\n\nDate & Time: ${timeString}${event.description ? `\n\n${event.description}` : ""}`;
      } else {
        title = `Event Reminder: ${event.title}`;
        message = `The event "${event.title}" is starting in 1 hour.\n\nDate & Time: ${timeString}${event.description ? `\n\n${event.description}` : ""}`;
      }

      // Send notifications
      const result = await NotificationService.notifyUsers(
        userIds,
        title,
        message,
        "reminders",
        false // Respect user email preferences
      );

      // Mark as sent
      this.sentReminders.set(reminderKey, new Date());

      return { sent: result.success, failed: result.failed };
    } catch (error) {
      console.error(`Error sending ${reminderType} reminder for event ${event.id}:`, error);
      return { sent: 0, error: error.message };
    }
  }

  /**
   * Process all upcoming events and send reminders
   */
  async processReminders() {
    if (this.isRunning) {
      console.log("Reminder scheduler already running, skipping...");
      return;
    }

    this.isRunning = true;
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find events that are upcoming and haven't started yet
      const upcomingEvents = await Event.findAll({
        where: {
          status: { [Op.in]: ["Upcoming", "Open"] },
          start_date: { [Op.gte]: now.toISOString().split("T")[0] },
        },
      });

      console.log(`Checking ${upcomingEvents.length} events for reminders...`);

      let totalSent = 0;
      for (const event of upcomingEvents) {
        // Check for 1 day reminder
        if (this.shouldSendReminder(event, "1day")) {
          const result = await this.sendReminder(event, "1day");
          if (result.sent > 0) {
            totalSent += result.sent;
            console.log(`Sent 1-day reminder for event "${event.title}" to ${result.sent} users`);
          }
        }

        // Check for 1 hour reminder
        if (this.shouldSendReminder(event, "1hour")) {
          const result = await this.sendReminder(event, "1hour");
          if (result.sent > 0) {
            totalSent += result.sent;
            console.log(`Sent 1-hour reminder for event "${event.title}" to ${result.sent} users`);
          }
        }
      }

      // Clean up old reminder tracking (older than 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      for (const [key, sentDate] of this.sentReminders.entries()) {
        if (sentDate < twoDaysAgo) {
          this.sentReminders.delete(key);
        }
      }

      if (totalSent > 0) {
        console.log(`Total reminders sent: ${totalSent}`);
      }
    } catch (error) {
      console.error("Error in reminder scheduler:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the scheduler (runs every 15 minutes)
   */
  start() {
    console.log("Event reminder scheduler started (checking every 15 minutes)");
    
    // Run immediately on start
    this.processReminders();

    // Then run every 15 minutes
    this.interval = setInterval(() => {
      this.processReminders();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("Event reminder scheduler stopped");
    }
  }
}

export default new EventReminderScheduler();

