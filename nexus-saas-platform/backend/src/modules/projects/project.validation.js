
const { z } = require("zod");

// ==========================================
// COMMON VALIDATION
// ==========================================

const projectStatuses = [
  "planned",
  "active",
  "on_hold",
  "completed"
];

const projectStatusSchema = z.enum(projectStatuses);

const projectDateSchema = z.union([
  z.coerce.date(),
  z.null()
]);

// ==========================================
// 1. CREATE PROJECT VALIDATION
// ==========================================

const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must contain at least 2 characters")
      .max(150, "Project name cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .default(""),

    status: projectStatusSchema.optional().default("planned"),

    startDate: projectDateSchema.optional().default(null),

    dueDate: projectDateSchema.optional().default(null)
  })
  .strict()
  .superRefine((data, context) => {
    if (
      data.startDate &&
      data.dueDate &&
      data.dueDate < data.startDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be earlier than start date"
      });
    }
  });

// ==========================================
// 2. UPDATE PROJECT VALIDATION
// ==========================================

const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must contain at least 2 characters")
      .max(150, "Project name cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    status: projectStatusSchema.optional(),

    startDate: projectDateSchema.optional(),

    dueDate: projectDateSchema.optional()
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required for project update"
    }
  )
  .superRefine((data, context) => {
    // Compare dates when both are supplied.
    // If only one date is supplied, the service will compare
    // it with the existing project's other date.

    if (
      data.startDate &&
      data.dueDate &&
      data.dueDate < data.startDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be earlier than start date"
      });
    }
  });

// ==========================================
// 3. VALIDATION MIDDLEWARE
// ==========================================

const validateCreateProject = (req, res, next) => {
  const result = createProjectSchema.safeParse(req.body);

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

const validateUpdateProject = (req, res, next) => {
  const result = updateProjectSchema.safeParse(req.body);

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

// ==========================================
// 4. ORGANIZATION ID VALIDATION
// ==========================================

const validateProjectOrganizationId = (req, res, next) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(req.params.organizationId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization ID"
    });
  }

  next();
};

// ==========================================
// 5. PROJECT ID VALIDATION
// ==========================================

const validateProjectId = (req, res, next) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(req.params.projectId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID"
    });
  }

  next();
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  validateCreateProject,
  validateUpdateProject,
  validateProjectOrganizationId,
  validateProjectId
};
