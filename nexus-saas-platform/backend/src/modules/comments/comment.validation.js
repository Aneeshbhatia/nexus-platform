
const { z } = require("zod");

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

// Create comment validation
const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),

  parentCommentId: objectIdSchema
    .nullable()
    .optional()
    .default(null)
}).strict();

// Update comment validation
const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters")
}).strict();

// Pagination validation
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

// Validate route parameters
const validateCommentParams = (req, res, next) => {
  const paramsSchema = z.object({
    organizationId: objectIdSchema,
    projectId: objectIdSchema,
    taskId: objectIdSchema
  });

  const result = paramsSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid route parameters",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  next();
};

// Validate comment ID
const validateCommentId = (req, res, next) => {
  const result = objectIdSchema.safeParse(req.params.commentId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid comment ID"
    });
  }

  next();
};

// Validate create comment body
const validateCreateComment = (req, res, next) => {
  const result = createCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Comment validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.body = result.data;
  next();
};

// Validate update comment body
const validateUpdateComment = (req, res, next) => {
  const result = updateCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Comment validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.body = result.data;
  next();
};

// Validate pagination query
const validateCommentPagination = (req, res, next) => {
  const result = paginationSchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  req.pagination = result.data;
  next();
};

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  paginationSchema,
  validateCommentParams,
  validateCommentId,
  validateCreateComment,
  validateUpdateComment,
  validateCommentPagination
};
