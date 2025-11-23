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
  // Template is in public folder at root level
  // __dirname is backend/controllers, so go up two levels to reach root
  const rootDir = path.resolve(__dirname, "../..");
  return path.join(rootDir, "public", "certificateOfParticipation.pdf");
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

    // 6. Format dates
    const eventDate = new Date(registration.event.start_date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const issueDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 7. Add text fields
    // NOTE: These coordinates are approximate. You'll need to adjust them
    // based on your actual PDF template layout. Use a PDF editor to find exact positions.

    // Participant Name (centered, larger, bold)
    const participantName = registration.user.name;
    const nameFontSize = 28;
    const nameTextWidth = helveticaBoldFont.widthOfTextAtSize(
      participantName,
      nameFontSize
    );
    firstPage.drawText(participantName, {
      x: width / 2 - nameTextWidth / 2, // Center horizontally
      y: height * 0.55, // Adjust based on template (typically middle-upper area)
      size: nameFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    // Event Title
    const eventTitle = registration.event.title;
    const titleFontSize = 18;
    const titleTextWidth = helveticaFont.widthOfTextAtSize(
      eventTitle,
      titleFontSize
    );
    firstPage.drawText(eventTitle, {
      x: width / 2 - titleTextWidth / 2,
      y: height * 0.45, // Below name
      size: titleFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Event Date
    const dateFontSize = 14;
    const dateTextWidth = helveticaFont.widthOfTextAtSize(
      eventDate,
      dateFontSize
    );
    firstPage.drawText(eventDate, {
      x: width / 2 - dateTextWidth / 2,
      y: height * 0.38, // Below event title
      size: dateFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Issue Date (optional, at bottom)
    const issueDateText = `Issued on: ${issueDate}`;
    const issueDateFontSize = 10;
    const issueDateTextWidth = helveticaFont.widthOfTextAtSize(
      issueDateText,
      issueDateFontSize
    );
    firstPage.drawText(issueDateText, {
      x: width / 2 - issueDateTextWidth / 2,
      y: height * 0.15, // Near bottom
      size: issueDateFontSize,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
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

