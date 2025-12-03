import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateTestCertificate = async () => {
  try {
    const templatePath = path.join(__dirname, "public", "certificateOfParticipation.pdf");
    
    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found at ${templatePath}`);
      return;
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log(`PDF Dimensions: Width=${width}, Height=${height}`);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper functions
    const toTitleCase = (str) => {
      return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };

    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    // Mock Data
    const participantName = toTitleCase("john doe");
    const eventTitle = "Advanced React Workshop";
    const eventDateObj = new Date("2023-10-15");
    const day = eventDateObj.getDate();
    const month = eventDateObj.toLocaleDateString("en-US", { month: "long" });
    const year = eventDateObj.getFullYear();
    const eventDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;

    // Participant Name
    const nameFontSize = 30;
    const nameTextWidth = helveticaBoldFont.widthOfTextAtSize(participantName, nameFontSize);
    firstPage.drawText(participantName, {
      x: width / 2 - nameTextWidth / 2,
      y: 200,
      size: nameFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    // Event Title Line
    const eventTitleText = `For participating in ${eventTitle}`;
    const eventTitleFontSize = 16;
    const eventTitleTextWidth = helveticaFont.widthOfTextAtSize(eventTitleText, eventTitleFontSize);
    firstPage.drawText(eventTitleText, {
      x: width / 2 - eventTitleTextWidth / 2,
      y: 230,
      size: eventTitleFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Date Line
    const dateText = `on ${eventDate}`;
    const dateFontSize = 16;
    const dateTextWidth = helveticaFont.widthOfTextAtSize(dateText, dateFontSize);
    firstPage.drawText(dateText, {
      x: width / 2 - dateTextWidth / 2,
      y: 200,
      size: dateFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync("test_certificate.pdf", pdfBytes);
    console.log("✅ Test certificate generated: test_certificate.pdf");
    console.log(`   Name: ${participantName} (Title Case)`);
    console.log(`   Event: ${eventTitleText}`);
    console.log(`   Date: ${dateText}`);

  } catch (error) {
    console.error("❌ Error generating certificate:", error);
  }
};

generateTestCertificate();
