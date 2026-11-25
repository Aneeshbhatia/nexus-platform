const { z } = require("zod");

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

// Query pagination & filter validation
const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z.enum(["true", "false"]).optional()
}).strict();

// Validate organizationId in params
const validateNotificationOrgId = (req, res, next) => {
  const result = objectIdSchema.safeParse(req.params.organizationId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization ID"
    });
  }

  next();
};

// Validate notificationId in params
const validateNotificationId = (req, res, next) => {
  const result = objectIdSchema.safeParse(req.params.notificationId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID"
    });
  }

  next();
};

// Validate notification listing query parameters
const validateNotificationQuery = (req, res, next) => {
  const result = notificationQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.query = result.data;
  next();
};

module.exports = {
  validateNotificationOrgId,
  validateNotificationId,
  validateNotificationQuery
};

