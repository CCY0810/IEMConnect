import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import User from "../models/User.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Joi from "joi";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new event
export const createEvent = async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      director_name: Joi.string().min(1).required(),
      director_matric: Joi.string().length(9).required()
        .messages({
          'string.length': 'Matric number must be exactly 9 characters',
          'any.required': 'Matric number is required'
        }),
      director_phone: Joi.string().min(1).required(),
      director_email: Joi.string().email().required()
        .messages({
          'string.email': 'Please enter a valid email address',
          'any.required': 'Email is required'
        }),
      title: Joi.string().min(1).required(),
      description: Joi.string().allow("", null).optional(),
      cost: Joi.number().min(0).optional(),
      targeted_participants: Joi.string().allow("", null).optional(),
      start_date: Joi.date().required(),
      end_date: Joi.date().required(),
      start_time: Joi.string().allow("", null).optional(),
      end_time: Joi.string().allow("", null).optional(),
      status: Joi.string().valid("Upcoming", "Open", "Completed").optional(),
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const {
      director_name,
      director_matric,
      director_phone,
      director_email,
      title,
      description,
      cost,
      targeted_participants,
      start_date,
      end_date,
      status,
    } = value;

    // Handle file uploads
    const poster_file = req.files?.poster_file?.[0]?.filename || null;
    const paperwork_file = req.files?.paperwork_file?.[0]?.filename || null;

    // Create event
    const event = await Event.create({
      director_name,
      director_matric,
      director_phone,
      director_email,
      title,
      description,
      cost: cost || 0,
      targeted_participants,
      start_date,
      end_date,
      status: status || "Upcoming",
      poster_file,
      paperwork_file,
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res
      .status(500)
      .json({ error: "Failed to create event", details: error.message });
  }
};

// Get all events with optional search
export const getEvents = async (req, res) => {
  try {
    const { search, status } = req.query;
    const userId = req.user?.id;

    const whereClause = {};

    // Search by title, director name, or status
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { director_name: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const events = await Event.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    // Get participant counts for all events
    const eventsWithData = await Promise.all(
      events.map(async (event) => {
        const eventData = event.toJSON();

        // Add file URLs
        if (eventData.poster_file) {
          eventData.poster_url = `/api/v1/events/files/${eventData.poster_file}`;
        }
        if (eventData.paperwork_file) {
          eventData.paperwork_url = `/api/v1/events/files/${eventData.paperwork_file}`;
        }

        // Get participant count
        const participantCount = await EventRegistration.count({
          where: { event_id: event.id, status: "registered" },
        });
        eventData.participant_count = participantCount;

        // Check if current user is registered (if userId provided)
        if (userId) {
          const userRegistration = await EventRegistration.findOne({
            where: {
              event_id: event.id,
              user_id: userId,
            },
          });
          eventData.is_registered = !!userRegistration;
          eventData.registration_status = userRegistration?.status || null;
        }

        return eventData;
      })
    );

    res.json({ events: eventsWithData });
  } catch (error) {
    console.error("Get events error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch events", details: error.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const eventData = event.toJSON();

    // Add full URLs for files
    if (eventData.poster_file) {
      eventData.poster_url = `/api/v1/events/files/${eventData.poster_file}`;
    }
    if (eventData.paperwork_file) {
      eventData.paperwork_url = `/api/v1/events/files/${eventData.paperwork_file}`;
    }

    // Get participant count
    const participantCount = await EventRegistration.count({
      where: { event_id: id, status: "registered" },
    });
    eventData.participant_count = participantCount;

    // Check if current user is registered (if userId provided)
    if (userId) {
      const userRegistration = await EventRegistration.findOne({
        where: {
          event_id: id,
          user_id: userId,
        },
      });
      eventData.is_registered = !!userRegistration;
      eventData.registration_status = userRegistration?.status || null;
    }

    res.json({ event: eventData });
  } catch (error) {
    console.error("Get event error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch event", details: error.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    // Validation schema for update (all fields optional except validation rules)
    const schema = Joi.object({
      director_name: Joi.string().min(1).optional(),
      director_matric: Joi.string().length(9).optional()
        .messages({
          'string.length': 'Matric number must be exactly 9 characters'
        }),
      director_phone: Joi.string().min(1).optional(),
      director_email: Joi.string().email().optional()
        .messages({
          'string.email': 'Please enter a valid email address'
        }),
      title: Joi.string().min(1).optional(),
      description: Joi.string().allow("", null).optional(),
      cost: Joi.number().min(0).optional(),
      targeted_participants: Joi.string().allow("", null).optional(),
      start_date: Joi.date().optional(),
      end_date: Joi.date().optional(),
      start_time: Joi.string().allow("", null).optional(),
      end_time: Joi.string().allow("", null).optional(),
      status: Joi.string().valid("Upcoming", "Open", "Completed").optional(),
    });

    const { error, value: validatedData } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const {
      director_name,
      director_matric,
      director_phone,
      director_email,
      title,
      description,
      cost,
      targeted_participants,
      start_date,
      end_date,
      status,
    } = validatedData;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Handle file replacements
    let poster_file = event.poster_file;
    let paperwork_file = event.paperwork_file;

    if (req.files?.poster_file?.[0]) {
      // Delete old poster if exists
      if (event.poster_file) {
        const oldPosterPath = path.join(
          __dirname,
          "../uploads",
          event.poster_file
        );
        if (fs.existsSync(oldPosterPath)) {
          fs.unlinkSync(oldPosterPath);
        }
      }
      poster_file = req.files.poster_file[0].filename;
    }

    if (req.files?.paperwork_file?.[0]) {
      // Delete old paperwork if exists
      if (event.paperwork_file) {
        const oldPaperworkPath = path.join(
          __dirname,
          "../uploads",
          event.paperwork_file
        );
        if (fs.existsSync(oldPaperworkPath)) {
          fs.unlinkSync(oldPaperworkPath);
        }
      }
      paperwork_file = req.files.paperwork_file[0].filename;
    }

    // Update event
    await event.update({
      director_name: director_name || event.director_name,
      director_matric: director_matric || event.director_matric,
      director_phone: director_phone || event.director_phone,
      director_email: director_email || event.director_email,
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      cost: cost !== undefined ? cost : event.cost,
      targeted_participants:
        targeted_participants || event.targeted_participants,
      start_date: start_date || event.start_date,
      end_date: end_date || event.end_date,
      status: status || event.status,
      poster_file,
      paperwork_file,
    });

    res.json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res
      .status(500)
      .json({ error: "Failed to update event", details: error.message });
  }
};

// Start event (change status from Upcoming to Open)
export const startEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event status is 'Upcoming'
    if (event.status !== "Upcoming") {
      return res.status(400).json({
        error: `Event cannot be started. Current status is '${event.status}'. Only events with status 'Upcoming' can be started.`,
      });
    }

    // Validate time window
    const now = new Date();
    const klTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours for KL time

    // Check if today is within the event date range
    const today = new Date(klTime);
    today.setHours(0, 0, 0, 0);

    const [startYear, startMonth, startDay] = event.start_date.split("-");
    const startDate = new Date(
      parseInt(startYear),
      parseInt(startMonth) - 1,
      parseInt(startDay)
    );
    startDate.setHours(0, 0, 0, 0);

    const [endYear, endMonth, endDay] = event.end_date.split("-");
    const endDate = new Date(
      parseInt(endYear),
      parseInt(endMonth) - 1,
      parseInt(endDay)
    );
    endDate.setHours(0, 0, 0, 0);

    // Check if today is within the event date range
    if (today < startDate || today > endDate) {
      return res.status(400).json({
        error: `Event cannot be started. The event is scheduled for ${startDate.toLocaleDateString()}${
          startDate.getTime() !== endDate.getTime()
            ? " to " + endDate.toLocaleDateString()
            : ""
        }. Please wait until the scheduled date.`,
      });
    }

    // If start_time and end_time are specified, validate them
    if (event.start_time || event.end_time) {
      const currentTime =
        klTime.getHours() * 3600 + klTime.getMinutes() * 60 + klTime.getSeconds();

      if (event.start_time) {
        const [startHour, startMin, startSec] = event.start_time.split(":");
        const startTimeSeconds =
          parseInt(startHour) * 3600 +
          parseInt(startMin) * 60 +
          (startSec ? parseInt(startSec) : 0);

        if (currentTime < startTimeSeconds) {
          return res.status(400).json({
            error: `Event cannot be started. The event starts at ${event.start_time}. Please wait until the scheduled start time.`,
          });
        }
      }

      if (event.end_time) {
        const [endHour, endMin, endSec] = event.end_time.split(":");
        const endTimeSeconds =
          parseInt(endHour) * 3600 +
          parseInt(endMin) * 60 +
          (endSec ? parseInt(endSec) : 0);

        if (currentTime > endTimeSeconds) {
          return res.status(400).json({
            error: `Event cannot be started. The event ended at ${event.end_time}.`,
          });
        }
      }
    }

    // All validations passed - update status to 'Open'
    await event.update({ status: "Open" });

    res.json({
      message: "Event started successfully",
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
      },
    });
  } catch (error) {
    console.error("Start event error:", error);
    res.status(500).json({ error: "Failed to start event" });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete associated files
    if (event.poster_file) {
      const posterPath = path.join(__dirname, "../uploads", event.poster_file);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }

    if (event.paperwork_file) {
      const paperworkPath = path.join(
        __dirname,
        "../uploads",
        event.paperwork_file
      );
      if (fs.existsSync(paperworkPath)) {
        fs.unlinkSync(paperworkPath);
      }
    }

    await event.destroy();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete event", details: error.message });
  }
};

// Serve uploaded files
export const getFile = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file extension to determine MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    // Set Content-Type header explicitly based on extension
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);
    
    // Set cache headers for images
    if (mimeType.startsWith("image/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    }
    
    // Send file - Express will handle the rest
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      where: {
        user_id: userId,
        event_id: id,
      },
    });

    if (existingRegistration) {
      return res
        .status(400)
        .json({ error: "Already registered for this event" });
    }

    // Create registration
    const registration = await EventRegistration.create({
      user_id: userId,
      event_id: id,
      status: "registered",
    });

    res.status(201).json({
      message: "Successfully registered for event",
      registration,
    });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({ error: "Failed to register for event" });
  }
};

// Unregister from an event
export const unregisterFromEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find registration
    const registration = await EventRegistration.findOne({
      where: {
        user_id: userId,
        event_id: id,
      },
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Delete registration
    await registration.destroy();

    res.json({ message: "Successfully unregistered from event" });
  } catch (error) {
    console.error("Unregister from event error:", error);
    res.status(500).json({ error: "Failed to unregister from event" });
  }
};

// Get participants for an event (admin only)
export const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all registrations with user details
    const registrations = await EventRegistration.findAll({
      where: { event_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "name",
            "email",
            "membership_number",
            "matric_number",
            "faculty",
          ],
        },
      ],
      order: [["registration_date", "ASC"]],
    });

    res.json({
      event: {
        id: event.id,
        title: event.title,
      },
      total_participants: registrations.length,
      participants: registrations.map((reg) => ({
        id: reg.id,
        user: reg.user,
        registration_date: reg.registration_date,
        status: reg.status,
      })),
    });
  } catch (error) {
    console.error("Get event participants error:", error);
    res.status(500).json({ error: "Failed to fetch participants" });
  }
};
