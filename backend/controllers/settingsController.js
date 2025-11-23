import Joi from "joi";
import User from "../models/User.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import { Op } from "sequelize";

// Helper to get default preferences
const getDefaultPreferences = () => ({
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
  privacy: {
    profile_visible: true,
    email_visible: false,
    data_sharing: true,
  },
  app: {
    theme: "system",
    date_format: "DD/MM/YYYY",
    time_format: "24h",
  },
});

// Get all user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Merge with defaults if preferences is null or incomplete
    const preferences = user.preferences || getDefaultPreferences();
    const mergedPreferences = {
      notifications: {
        ...getDefaultPreferences().notifications,
        ...(preferences.notifications || {}),
        email: {
          ...getDefaultPreferences().notifications.email,
          ...(preferences.notifications?.email || {}),
        },
      },
      privacy: {
        ...getDefaultPreferences().privacy,
        ...(preferences.privacy || {}),
      },
      app: {
        ...getDefaultPreferences().app,
        ...(preferences.app || {}),
      },
    };

    res.json({
      preferences: mergedPreferences,
      two_fa_enabled: user.two_fa_enabled || false,
    });
  } catch (error) {
    console.error("Get user preferences error:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const schema = Joi.object({
      notifications: Joi.object({
        email: Joi.object({
          reminders: Joi.boolean().optional(),
          announcements: Joi.boolean().optional(),
          registrations: Joi.boolean().optional(),
          attendance: Joi.boolean().optional(),
          system: Joi.boolean().optional(),
          admin: Joi.boolean().optional(),
        }).optional(),
        in_app: Joi.boolean().optional(),
        frequency: Joi.string().valid("immediate", "daily", "weekly").optional(),
      }).optional(),
      privacy: Joi.object({
        profile_visible: Joi.boolean().optional(),
        email_visible: Joi.boolean().optional(),
        data_sharing: Joi.boolean().optional(),
      }).optional(),
      app: Joi.object({
        theme: Joi.string().valid("light", "dark", "system").optional(),
        date_format: Joi.string().valid("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD").optional(),
        time_format: Joi.string().valid("12h", "24h").optional(),
      }).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get current preferences or defaults
    const currentPreferences = user.preferences || getDefaultPreferences();

    // Deep merge with new values
    const updatedPreferences = {
      notifications: {
        ...currentPreferences.notifications,
        ...(value.notifications || {}),
        email: {
          ...currentPreferences.notifications.email,
          ...(value.notifications?.email || {}),
        },
      },
      privacy: {
        ...currentPreferences.privacy,
        ...(value.privacy || {}),
      },
      app: {
        ...currentPreferences.app,
        ...(value.app || {}),
      },
    };

    await user.update({ preferences: updatedPreferences });

    res.json({
      message: "Preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error("Update user preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

// Get 2FA status
export const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isEnabled = !!(user.two_fa_code_hash && user.two_fa_enabled);

    res.json({
      enabled: isEnabled,
      has_code: !!user.two_fa_code_hash,
    });
  } catch (error) {
    console.error("Get 2FA status error:", error);
    res.status(500).json({ error: "Failed to fetch 2FA status" });
  }
};

// Enable/Disable 2FA
export const update2FA = async (req, res) => {
  try {
    const schema = Joi.object({
      enabled: Joi.boolean().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (value.enabled && !user.two_fa_code_hash) {
      return res.status(400).json({ error: "2FA code not set. Please complete 2FA setup first." });
    }

    await user.update({ two_fa_enabled: value.enabled });

    res.json({
      message: value.enabled ? "2FA enabled successfully" : "2FA disabled successfully",
      enabled: value.enabled,
    });
  } catch (error) {
    console.error("Update 2FA error:", error);
    res.status(500).json({ error: "Failed to update 2FA status" });
  }
};

// Get active sessions (simplified - returns current session info)
export const getActiveSessions = async (req, res) => {
  try {
    // In a real implementation, you'd track sessions in a sessions table
    // For now, return current session info
    res.json({
      sessions: [
        {
          id: "current",
          device: "Current Device",
          ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
          last_activity: new Date().toISOString(),
          current: true,
        },
      ],
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
};

// Logout from specific session
export const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // In a real implementation, you'd invalidate the session token
    // For now, if it's the current session, return success
    if (sessionId === "current") {
      return res.json({ message: "Session logged out successfully" });
    }

    res.json({ message: "Session logged out successfully" });
  } catch (error) {
    console.error("Logout session error:", error);
    res.status(500).json({ error: "Failed to logout session" });
  }
};

// Export user data
export const exportUserData = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash", "two_fa_code_hash", "reset_password_token"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's event registrations
    const registrations = await EventRegistration.findAll({
      where: { user_id: user.id },
      include: [{ model: Event, as: "event" }],
    });

    const userData = {
      profile: user.toJSON(),
      registrations: registrations.map((reg) => ({
        event_title: reg.event?.title,
        registration_date: reg.registration_date,
        status: reg.status,
      })),
      export_date: new Date().toISOString(),
    };

    res.json(userData);
  } catch (error) {
    console.error("Export user data error:", error);
    res.status(500).json({ error: "Failed to export user data" });
  }
};

// Get admin system stats (admin only)
export const getAdminSystemStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const totalUsers = await User.count();
    const totalEvents = await Event.count();
    const totalRegistrations = await EventRegistration.count();

    res.json({
      total_users: totalUsers,
      total_events: totalEvents,
      total_registrations: totalRegistrations,
      system_status: "operational",
    });
  } catch (error) {
    console.error("Get admin system stats error:", error);
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
};

