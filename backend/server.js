const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load environment variables FIRST, before anything reads process.env
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");
const complaintRoutes = require("./routes/complaintroutes");
const userRoutes = require("./routes/userroutes");

// Stop the server early if a required environment variable is missing
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in .env file");
  process.exit(1);
}

const app = express();

// Connect to MongoDB
connectDB();

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allows the browser to send/receive the auth cookie
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // needed so protect middleware can read req.cookies.token

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Waste Management API is running 🚛",
  });
});

// Auth:       /api/auth/register, /login, /logout, /me
app.use("/api/auth", authRoutes);

// Complaints: /api/complaints, /my, /:id, /:id/status, /:id/assign
app.use("/api/complaints", complaintRoutes);

// Users:      /api/users/collectors (admin only)
app.use("/api/users", userRoutes);

// ---------------------------------------------------------------
// 404 handler (no route matched)
// ---------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ---------------------------------------------------------------
// Global error handler (catches anything that slips through)
// ---------------------------------------------------------------
app.use((err, req, res, next) => {
  // Invalid JSON sent in the request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

// ---------------------------------------------------------------
// Start server
// ---------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
