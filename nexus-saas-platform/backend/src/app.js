const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// ==========================================
// 1. IMPORT ROUTES
// ==========================================

const authRoutes = require("./modules/auth/auth.routes");
const organizationRoutes = require("./modules/organizations/organization.routes");
const membershipRoutes = require("./modules/memberships/membership.routes");
const auditLogRoutes = require("./modules/auditLogs/auditLog.routes");
const projectRoutes = require("./modules/projects/project.routes");
const taskRoutes = require("./modules/tasks/task.routes");
const commentRoutes = require("./modules/comments/comment.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");

// ==========================================
// 2. INITIALIZE EXPRESS
// ==========================================

const app = express();

// ==========================================
// 3. SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ==========================================
// 4. BODY PARSING
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 5. LOGGING
// ==========================================

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ==========================================
// 6. HEALTH CHECK
// ==========================================

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "NEXUS API is running",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 7. API ROUTES
// ==========================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/organizations", auditLogRoutes);
app.use("/api/v1/organizations", organizationRoutes);

app.use("/api/v1", membershipRoutes);
app.use("/api/v1", projectRoutes);
app.use("/api/v1", taskRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1", notificationRoutes);

// ==========================================
// 8. 404 HANDLER
// ==========================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// 9. GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("Application Error:", err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
});

// ==========================================
// 10. EXPORT APP
// ==========================================

module.exports = app;
