import Notification from "../models/Notification.js";
import User from "../models/User.js";
import EmailService from "../utils/emailService.js";
import { Op } from "sequelize";

class NotificationService {
  /**
   * Get default preferences structure
   */
  getDefaultPreferences() {
    return {
      notifications: {
        email: {
          reminders: true,
          announcements: true,
          registrations: true,
          attendance: true,
          system: true,
          admin: true,
        },
        in_app: true,
        frequency: "immediate",
      },
    };
  }

  /**
   * Check if user has email notification enabled for a specific type
   * @param {Object} user - User object with preferences
   * @param {string} notificationType - Type of notification (reminders, announcements, registrations, attendance, system, admin)
   * @returns {boolean} - Whether email notification is enabled
   */
  shouldSendEmail(user, notificationType) {
    if (!user || !user.preferences) {
      // Default to true if preferences not set
      return true;
    }

    const prefs = user.preferences;
    const defaultPrefs = this.getDefaultPreferences();

    // Merge with defaults
    const emailPrefs = {
      ...defaultPrefs.notifications.email,
      ...(prefs.notifications?.email || {}),
    };

    // Check specific notification type (defaults to true if not set)
    return emailPrefs[notificationType] !== false;
  }

  /**
   * Notify a user with both in-app notification and optional email
   * @param {number} userId - The user ID to notify
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} notificationType - Type of notification (reminders, announcements, registrations, attendance, system, admin)
   * @param {boolean} forceEmail - Force email regardless of preferences (default: false)
   * @returns {Promise<Object>} - Created notification
   */
  async notifyUser(
    userId,
    title,
    message,
    notificationType = "system",
    forceEmail = false
  ) {
    try {
      // Get user with preferences
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check if in-app notifications are enabled
      const prefs = user.preferences || {};
      const defaultPrefs = this.getDefaultPreferences();
      const inAppEnabled =
        prefs.notifications?.in_app !== undefined
          ? prefs.notifications.in_app
          : defaultPrefs.notifications.in_app;

      // Always save to database if in-app notifications are enabled (default: true)
      let notification = null;
      if (inAppEnabled) {
        notification = await Notification.create({
          user_id: userId,
          title,
          message,
          is_read: false,
          created_at: new Date(),
        });
      }

      // Send email if preferences allow it or if forced
      // Email is sent independently of in-app notifications
      const shouldEmail =
        forceEmail || this.shouldSendEmail(user, notificationType);

      if (shouldEmail && user.email) {
        try {
          await EmailService.sendNotificationEmail(
            user.email,
            user.name,
            title,
            message
          );
        } catch (emailError) {
          // Log email error but don't fail the notification
          console.error(
            `Failed to send email notification to user ${userId}:`,
            emailError
          );
        }
      }

      // Return notification or a placeholder if in-app is disabled
      return (
        notification || {
          id: null,
          user_id: userId,
          title,
          message,
          is_read: false,
        }
      );
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Notify multiple users (e.g., all event participants)
   * @param {Array<number>} userIds - Array of user IDs
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} notificationType - Type of notification (reminders, announcements, registrations, attendance, system, admin)
   * @param {boolean} forceEmail - Force email regardless of preferences (default: false)
   * @returns {Promise<Object>} - Summary of notifications sent
   */
  async notifyUsers(
    userIds,
    title,
    message,
    notificationType = "system",
    forceEmail = false
  ) {
    const results = {
      total: userIds.length,
      success: 0,
      failed: 0,
      notifications: [],
    };

    // Process notifications in parallel for better performance
    const promises = userIds.map(async (userId) => {
      try {
        const notification = await this.notifyUser(
          userId,
          title,
          message,
          notificationType,
          forceEmail
        );
        results.success++;
        results.notifications.push(notification);
        return { success: true, userId, notification };
      } catch (error) {
        results.failed++;
        console.error(`Failed to notify user ${userId}:`, error);
        return { success: false, userId, error: error.message };
      }
    });

    await Promise.allSettled(promises);

    return results;
  }

  /**
   * Clean up old notifications (data retention)
   * Deletes notifications older than specified days (default: 30)
   * @param {number} daysToKeep - Number of days to keep (default: 30)
   * @returns {Promise<number>} - Number of notifications deleted
   */
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      console.log(
        `Cleaned up ${deletedCount} notifications older than ${daysToKeep} days`
      );
      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      });
      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }
}

export default new NotificationService();

