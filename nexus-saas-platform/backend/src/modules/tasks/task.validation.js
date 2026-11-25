
const { z } = require("zod");

const taskStatuses = [
  "todo",
  "in_progress",
  "in_review",
  "completed",
  "cancelled"
];

const taskPriorities = [
  "low",
  "medium",
  "high",
  "urgent"
];

// Reusable date validation
const dateSchema = z
  .union([
    z.coerce.date(),
    z.null()
  ])
  .optional();

// Validate task creation
const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must contain at least 2 characters")
    .max(200, "Task title cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .default(""),

  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid assigned user ID")
    .nullable()
    .optional()
    .default(null),

  status: z
    .enum(taskStatuses)
    .optional()
    .default("todo"),

  priority: z
    .enum(taskPriorities)
    .optional()
    .default("medium"),

  dueDate: dateSchema
}).strict();

// Validate task updates
const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must contain at least 2 characters")
    .max(200, "Task title cannot exceed 200 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid assigned user ID")
    .nullable()
    .optional(),

  status: z
    .enum(taskStatuses)
    .optional(),

  priority: z
    .enum(taskPriorities)
    .optional(),

  dueDate: dateSchema
})
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required for update"
    }
  );

// Validate organization ID
const validateTaskOrganizationId = (req, res, next) => {
  const organizationIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid organization ID");

  const result = organizationIdSchema.safeParse(
    req.params.organizationId
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0].message
    });
  }

  next();
};

// Validate project ID
const validateTaskProjectId = (req, res, next) => {
  const projectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID");

  const result = projectIdSchema.safeParse(
    req.params.projectId
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0].message
    });
  }

  next();
};

// Validate task ID
const validateTaskId = (req, res, next) => {
  const taskIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID");

  const result = taskIdSchema.safeParse(
    req.params.taskId
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0].message
    });
  }

  next();
};

// Validate create task request body
const validateCreateTask = (req, res, next) => {
  const result = createTaskSchema.safeParse(req.body);

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

// Validate update task request body
const validateUpdateTask = (req, res, next) => {
  const result = updateTaskSchema.safeParse(req.body);

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
  taskStatuses,
  taskPriorities,
  createTaskSchema,
  updateTaskSchema,
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateTaskId,
  validateCreateTask,
  validateUpdateTask
};
