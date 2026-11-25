
const { z } = require("zod");

const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase()),

  role: z
    .enum(["admin", "manager", "member"])
    .default("member")
});

const updateMemberRoleSchema = z.object({
  role: z.enum(
    ["admin", "manager", "member"],
    "Please provide a valid membership role"
  )
});

const validateInviteMember = (req, res, next) => {
  const result = inviteMemberSchema.safeParse(req.body);

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

const validateUpdateMemberRole = (req, res, next) => {
  const result = updateMemberRoleSchema.safeParse(req.body);

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

const validateOrganizationId = (req, res, next) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(req.params.organizationId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid organization ID"
    });
  }

  next();
};

const validateMembershipId = (req, res, next) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(req.params.membershipId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid membership ID"
    });
  }

  next();
};

module.exports = {
  validateInviteMember,
  validateUpdateMemberRole,
  validateOrganizationId,
  validateMembershipId
};
