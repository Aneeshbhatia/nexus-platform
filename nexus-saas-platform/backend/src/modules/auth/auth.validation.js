
const { z } = require("zod");

// Registration validation
const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
});

// Login validation
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password cannot exceed 72 characters")
});

// Reusable validation middleware
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

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
};

const validateRegister = createValidationMiddleware(registerSchema);
const validateLogin = createValidationMiddleware(loginSchema);

module.exports = {
  validateRegister,
  validateLogin
};
