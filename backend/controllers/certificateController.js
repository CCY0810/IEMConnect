import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Event from "../models/Event.js";
import User from "../models/User.js";
import EventRegistration from "../models/EventRegistration.js";
import Attendance from "../models/Attendance.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache template in memory to avoid repeated file reads
let cachedTemplate = null;

const getTemplatePath = () => {
  // Template is in backend/public folder
  // __dirname is backend/controllers, so go up one level to reach backend
  const backendDir = path.resolve(__dirname, "..");
  return path.join(backendDir, "public", "certificateOfParticipation.pdf");
};

const loadTemplate = async () => {
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const templatePath = getTemplatePath();
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at ${templatePath}`);
  }

  cachedTemplate = fs.readFileSync(templatePath);
  return cachedTemplate;
};

/**
 * Generate certificate of participation for a user who attended an event
 * GET /api/v1/certificates/events/:eventId/certificate
 */
export const generateCertificate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // 1. Verify user attended the event
    const registration = await EventRegistration.findOne({
      where: { user_id: userId, event_id: eventId },
      include: [
        { model: User, as: "user" },
        { model: Event, as: "event" },
      ],
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // 2. Check if user actually attended (has attendance record)
    const attendance = await Attendance.findOne({
      where: { registration_id: registration.id },
    });

    if (!attendance) {
      return res.status(403).json({
        error:
          "Certificate only available for participants who attended the event",
      });
    }

    // 3. Load PDF template
    const templateBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(templateBytes);

    // 4. Get first page and dimensions
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 5. Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 6. Helper function to convert to Title Case
    const toTitleCase = (str) => {
      return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };

    // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    // 7. Format dates
    const eventDateObj = new Date(registration.event.start_date);
    const day = eventDateObj.getDate();
    const month = eventDateObj.toLocaleDateString("en-US", { month: "long" });
    const year = eventDateObj.getFullYear();
    const eventDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;

    // 8. Add text fields with precise A4 Landscape coordinates
    // A4 Landscape: Width = 842, Height = 595 (Y=0 is bottom)

    // Participant Name (Title Case, centered, larger, bold)
    const participantName = toTitleCase(registration.user.name);
    const nameFontSize = 30;
    const nameTextWidth = helveticaBoldFont.widthOfTextAtSize(
      participantName,
      nameFontSize
    );
    firstPage.drawText(participantName, {
      x: width / 2 - nameTextWidth / 2, // Center horizontally
      y: 260, // Fixed Y coordinate for A4 landscape
      size: nameFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    // Event Title Line ("For participating in...")
    const eventTitle = registration.event.title;
    const eventTitleText = `For participating in ${eventTitle}`;
    const eventTitleFontSize = 16;
    const eventTitleTextWidth = helveticaFont.widthOfTextAtSize(
      eventTitleText,
      eventTitleFontSize
    );
    firstPage.drawText(eventTitleText, {
      x: width / 2 - eventTitleTextWidth / 2,
      y: 230, // Fixed Y coordinate
      size: eventTitleFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Date Line
    const dateText = `on ${eventDate}`;
    const dateFontSize = 16;
    const dateTextWidth = helveticaFont.widthOfTextAtSize(
      dateText,
      dateFontSize
    );
    firstPage.drawText(dateText, {
      x: width / 2 - dateTextWidth / 2,
      y: 200, // Fixed Y coordinate
      size: dateFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // 8. Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // 9. Stream to client
    const safeEventTitle = registration.event.title.replace(/[^a-zA-Z0-9]/g, "_");
    const safeUserName = registration.user.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Certificate_${safeEventTitle}_${safeUserName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBytes.length);

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Certificate generation error:", error);
    
    if (error.message.includes("template not found")) {
      return res.status(500).json({ 
        error: "Certificate template not found. Please contact administrator." 
      });
    }
    
    res.status(500).json({ error: "Failed to generate certificate" });
  }
};

