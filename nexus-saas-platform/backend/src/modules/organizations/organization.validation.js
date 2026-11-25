
const { z } = require("zod");

// Create organization validation
const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must contain at least 2 characters")
    .max(150, "Organization name cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
});

// Update organization validation
const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must contain at least 2 characters")
    .max(150, "Organization name cannot exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  logo: z
    .string()
    .url("Logo must be a valid URL")
    .nullable()
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required"
  }
);

// Create validation middleware
const validateCreateOrganization = (req, res, next) => {
  const result = createOrganizationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.body = result.data;
  next();
};

// Update validation middleware
const validateUpdateOrganization = (req, res, next) => {
  const result = updateOrganizationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.body = result.data;
  next();
};

module.exports = {
  validateCreateOrganization,
  validateUpdateOrganization
};
