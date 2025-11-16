import Event from "../models/Event.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new event
export const createEvent = async (req, res) => {
  try {
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
    } = req.body;

    // Validate required fields
    if (
      !director_name ||
      !director_matric ||
      !director_phone ||
      !director_email ||
      !title ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    // Add full URLs for files
    const eventsWithUrls = events.map((event) => {
      const eventData = event.toJSON();
      if (eventData.poster_file) {
        eventData.poster_url = `/api/v1/events/files/${eventData.poster_file}`;
      }
      if (eventData.paperwork_file) {
        eventData.paperwork_url = `/api/v1/events/files/${eventData.paperwork_file}`;
      }
      return eventData;
    });

    res.json({ events: eventsWithUrls });
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
    } = req.body;

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

    res.sendFile(filePath);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};
