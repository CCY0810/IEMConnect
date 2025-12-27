import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import preventAutoSync from "./utils/preventSequelizeSync.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import reportsRoutes from "./routes/reports.js";
import attendanceRoutes from "./routes/attendance.js";
import notificationsRoutes from "./routes/notifications.js";
import certificatesRoutes from "./routes/certificates.js";
import chatbotRoutes from "./routes/chatbot.js";
import feedbackRoutes from "./routes/feedback.js";
import adminRoutes from "./routes/admin.js";
import { apiRateLimit } from "./middleware/rateLimiter.js";
import eventReminderScheduler from "./utils/eventReminderScheduler.js";

dotenv.config();

// CRITICAL: Prevent Sequelize from automatically syncing schema
// This stops duplicate index creation on every app start
preventAutoSync();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://iemconnect.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(compression()); // Enable response compression
app.use(express.json());
app.use(apiRateLimit); // Apply general rate limiting

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database sync - using validate instead of alter to prevent index duplication
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/certificates", certificatesRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Start event reminder scheduler
  eventReminderScheduler.start();
});
