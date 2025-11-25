import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

// Helper function to check if event is within scheduled time window
const isEventWithinTimeWindow = (event) => {
  // Use Kuala Lumpur time (UTC+8) consistently
  const now = new Date();
  const klTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours for KL time

  const today = new Date(klTime);
  today.setHours(0, 0, 0, 0);

  // Parse dates correctly for Kuala Lumpur timezone
  // Split the date string and create a date in local timezone
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
    return {
      allowed: false,
      message: `Event is scheduled for ${startDate.toLocaleDateString()}${
        startDate.getTime() !== endDate.getTime()
          ? " to " + endDate.toLocaleDateString()
          : ""
      }`,
    };
  }

  // If start_time and end_time are specified, check those too
  if (event.start_time || event.end_time) {
    // Use KL time for time comparison
    const currentTime =
      klTime.getHours() * 3600 + klTime.getMinutes() * 60 + klTime.getSeconds();

    if (event.start_time) {
      const [startHour, startMin, startSec] = event.start_time.split(":");
      const startTimeSeconds =
        parseInt(startHour) * 3600 +
        parseInt(startMin) * 60 +
        (startSec ? parseInt(startSec) : 0);

      if (currentTime < startTimeSeconds) {
        return {
          allowed: false,
          message: `Event starts at ${event.start_time}. Please wait until the scheduled time.`,
        };
      }
    }

    if (event.end_time) {
      const [endHour, endMin, endSec] = event.end_time.split(":");
      const endTimeSeconds =
        parseInt(endHour) * 3600 +
        parseInt(endMin) * 60 +
        (endSec ? parseInt(endSec) : 0);

      if (currentTime > endTimeSeconds) {
        return {
          allowed: false,
          message: `Event ended at ${event.end_time}.`,
        };
      }
    }
  }

  return { allowed: true };
};

// Helper function to generate random 8-digit code
const generateAttendanceCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Start attendance (admin only)
export const startAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event status is 'Open'
    if (event.status !== "Open") {
      return res.status(400).json({
        error:
          "Attendance cannot be started. Please update the event status to 'Open' first.",
      });
    }

    // Check if attendance is already active
    if (event.attendance_status === "Active") {
      return res.status(400).json({ error: "Attendance is already active" });
    }

    // Check if event is within scheduled time window
    const timeCheck = isEventWithinTimeWindow(event);
    if (!timeCheck.allowed) {
      return res.status(400).json({
        error: "Event not ready to start",
        message: timeCheck.message,
      });
    }

    // Generate new 8-digit code
    const attendanceCode = generateAttendanceCode();

    // Update event
    await event.update({
      attendance_code: attendanceCode,
      attendance_status: "Active",
      attendance_started_at: new Date(),
    });

    res.json({
      message: "Attendance started successfully",
      attendance_code: attendanceCode,
      attendance_status: "Active",
    });
  } catch (error) {
    console.error("Start attendance error:", error);
    res.status(500).json({ error: "Failed to start attendance" });
  }
};

// Stop attendance (admin only)
export const stopAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if attendance is active
    if (event.attendance_status !== "Active") {
      return res
        .status(400)
        .json({ error: "Attendance is not currently active" });
    }

    // Update event
    await event.update({
      attendance_status: "Closed",
      attendance_stopped_at: new Date(),
      attendance_code: null, // Clear the code
    });

    res.json({
      message: "Attendance stopped successfully",
      attendance_status: "Closed",
    });
  } catch (error) {
    console.error("Stop attendance error:", error);
    res.status(500).json({ error: "Failed to stop attendance" });
  }
};

// Get attendance list for an event (admin only)
export const getAttendanceList = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all attendance records for this event
    const attendanceRecords = await Attendance.findAll({
      include: [
        {
          model: EventRegistration,
          as: "registration",
          where: { event_id: id },
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "id",
                "name",
                "email",
                "matric_number",
                "membership_number",
              ],
            },
          ],
        },
      ],
      order: [["marked_at", "ASC"]],
    });

    const formattedRecords = attendanceRecords.map((record) => ({
      id: record.id,
      name: record.registration.user.name,
      matric_number: record.registration.user.matric_number,
      email: record.registration.user.email,
      membership_number: record.registration.user.membership_number,
      marked_at: record.marked_at,
      method: record.method,
    }));

    res.json({
      event: {
        id: event.id,
        title: event.title,
        attendance_status: event.attendance_status,
      },
      total_attended: formattedRecords.length,
      attendance_list: formattedRecords,
    });
  } catch (error) {
    console.error("Get attendance list error:", error);
    res.status(500).json({ error: "Failed to fetch attendance list" });
  }
};

// Check if event can be started (admin only)
export const canStartEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event is within scheduled time window
    const timeCheck = isEventWithinTimeWindow(event);

    res.json({
      can_start: timeCheck.allowed,
      message: timeCheck.message || "Event is ready to start",
      attendance_status: event.attendance_status,
    });
  } catch (error) {
    console.error("Can start event error:", error);
    res.status(500).json({ error: "Failed to check event status" });
  }
};

// Student check-in
export const checkIn = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!code) {
      return res.status(400).json({ error: "Attendance code is required" });
    }

    // Remove hyphens from code for comparison (handle both "12345678" and "1234-5678")
    const cleanCode = code.replace(/-/g, "");

    // 1. Find event by attendance code
    const event = await Event.findOne({
      where: { attendance_code: cleanCode },
    });

    if (!event) {
      return res.status(404).json({ error: "Invalid attendance code" });
    }

    // 2. Check if attendance is active
    if (event.attendance_status !== "Active") {
      return res.status(400).json({
        error: "Attendance is not currently active for this event",
      });
    }

    // 3. Check if event date has arrived (can only check in on or after event start date)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for date-only comparison
    const eventDate = new Date(event.start_date);
    eventDate.setHours(0, 0, 0, 0);

    if (today < eventDate) {
      return res.status(400).json({
        error: `Attendance check-in opens on ${eventDate.toLocaleDateString()}. You cannot check in before the event date.`,
      });
    }

    // 4. Check if user is registered for this event
    const registration = await EventRegistration.findOne({
      where: {
        user_id: userId,
        event_id: event.id,
      },
    });

    if (!registration) {
      return res.status(403).json({
        error: "You must be registered for this event to check in",
      });
    }

    // 5. Check if user has already checked in
    const existingAttendance = await Attendance.findOne({
      where: { registration_id: registration.id },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: "You have already checked in for this event",
      });
    }

    // Determine method based on request source
    const method = req.body.method || "Code";

    // Create attendance record
    const attendance = await Attendance.create({
      registration_id: registration.id,
      marked_at: new Date(),
      method: method,
    });

    // Update registration status to 'attended'
    await registration.update({ status: "attended" });

    res.status(201).json({
      message: "Attendance marked successfully!",
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
      },
      attendance: {
        id: attendance.id,
        marked_at: attendance.marked_at,
        method: attendance.method,
        status: "Attended",
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
};

// Get all events the current user has attended
export const getMyAttendedEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all attendance records for this user by joining through EventRegistration
    const attendanceRecords = await Attendance.findAll({
      include: [
        {
          model: EventRegistration,
          as: "registration",
          where: { user_id: userId, status: "attended" },
          include: [
            {
              model: Event,
              as: "event",
              attributes: [
                "id",
                "title",
                "description",
                "start_date",
                "end_date",
                "start_time",
                "end_time",
                "status",
                "poster_file",
                "director_name",
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: EventRegistration, as: "registration" },
          { model: Event, as: "event" },
          "start_date",
          "DESC",
        ],
      ],
    });

    // Format the response
    const events = attendanceRecords.map((attendance) => {
      const eventData = attendance.registration.event.toJSON();

      // Add file URLs
      if (eventData.poster_file) {
        eventData.poster_url = `/api/v1/events/files/${eventData.poster_file}`;
      }

      return {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        status: eventData.status,
        poster_url: eventData.poster_url || null,
        director_name: eventData.director_name,
        registration_status: "attended",
        attendance: {
          marked_at: attendance.marked_at,
          method: attendance.method,
        },
      };
    });

    res.json({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("Get my attended events error:", error);
    res.status(500).json({ error: "Failed to fetch attended events" });
  }
};