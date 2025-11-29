import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import User from "../models/User.js";

/**
 * Get relevant context from the database based on user query
 */
export const getChatbotContext = async (userId, userMessage) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "is_verified"],
    });

    const context = {
      userInfo: user ? user.toJSON() : null,
      events: [],
      registrations: [],
    };

    // Extract keywords from user message to determine what context to fetch
    const messageLower = userMessage.toLowerCase();

    // If user asks about events, get recent/upcoming events
    if (
      messageLower.includes("event") ||
      messageLower.includes("register") ||
      messageLower.includes("upcoming")
    ) {
      const events = await Event.findAll({
        limit: 10,
        order: [["start_date", "DESC"]],
        attributes: [
          "id",
          "title",
          "description",
          "start_date",
          "end_date",
          "status",
          "cost",
          "targeted_participants",
        ],
      });
      context.events = events.map((e) => e.toJSON());
    }

    // If user asks about their registrations or attendance
    if (
      messageLower.includes("my") ||
      messageLower.includes("register") ||
      messageLower.includes("attend") ||
      messageLower.includes("certificate")
    ) {
      const registrations = await EventRegistration.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Event,
            as: "event",
            attributes: [
              "id",
              "title",
              "start_date",
              "end_date",
              "status",
            ],
          },
        ],
        limit: 10,
        order: [["registration_date", "DESC"]],
      });
      context.registrations = registrations.map((r) => ({
        id: r.id,
        status: r.status,
        registration_date: r.registration_date,
        event: r.event ? r.event.toJSON() : null,
      }));
    }

    return context;
  } catch (error) {
    console.error("Error getting chatbot context:", error);
    return {
      userInfo: null,
      events: [],
      registrations: [],
    };
  }
};

/**
 * Format context into a readable string for the AI
 */
export const formatContextForAI = (context) => {
  let contextString = "";

  if (context.userInfo) {
    contextString += `User: ${context.userInfo.name} (${context.userInfo.email})\n`;
    contextString += `Role: ${context.userInfo.role}\n`;
    contextString += `Verified: ${context.userInfo.is_verified ? "Yes" : "No"}\n\n`;
  }

  if (context.events.length > 0) {
    contextString += "Recent Events:\n";
    context.events.forEach((event) => {
      contextString += `- ${event.title} (${event.status}) - ${event.start_date}\n`;
    });
    contextString += "\n";
  }

  if (context.registrations.length > 0) {
    contextString += "User's Registrations:\n";
    context.registrations.forEach((reg) => {
      if (reg.event) {
        contextString += `- ${reg.event.title}: ${reg.status} (registered on ${reg.registration_date})\n`;
      }
    });
    contextString += "\n";
  }

  return contextString;
};

