import NotificationService from "./notificationService.js";

/**
 * Cleanup old notifications (data retention)
 * This should be run periodically (e.g., daily via cron job or scheduled task)
 */
export const cleanupOldNotifications = async (daysToKeep = 30) => {
  try {
    console.log(`Starting notification cleanup (keeping last ${daysToKeep} days)...`);
    const deletedCount = await NotificationService.cleanupOldNotifications(daysToKeep);
    console.log(`Notification cleanup completed. Deleted ${deletedCount} old notifications.`);
    return deletedCount;
  } catch (error) {
    console.error("Error during notification cleanup:", error);
    throw error;
  }
};

// If running directly, execute cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOldNotifications(30)
    .then((count) => {
      console.log(`Cleanup finished. Deleted ${count} notifications.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}

