const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Security & utilities
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check endpoints
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: "NEXUS Enterprise Employee Management API is operational",
    timestamp: new Date().toISOString(),
  });
};
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// API Routes: mount both /api and /api/v1 prefixes for robust client compatibility
const mountRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/departments`, departmentRoutes);
  app.use(`${prefix}/employees`, employeeRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/leaves`, leaveRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
};

mountRoutes("/api");
mountRoutes("/api/v1");

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const start = async () => {
  await connectDB();

  // Auto-seed default accounts if database is fresh/empty
  try {
    const User = require("./models/User");
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("No existing users found in DB. Automatically provisioning demo accounts...");
      const { seedDatabase } = require("./utils/seedData");
      await seedDatabase(false);
    }
  } catch (seedErr) {
    console.log("Auto-seed notice:", seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`NEXUS Employee Management System Backend`);
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
};

start();

module.exports = app;
