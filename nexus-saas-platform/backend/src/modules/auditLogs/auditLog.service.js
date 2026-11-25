
const mongoose = require("mongoose");

const auditLogRepository = require("./auditLog.repository");
const membershipRepository = require("../memberships/membership.repository");
const organizationRepository = require("../organizations/organization.repository");

// Helper: create application errors
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Record an organization audit event
const recordOrganizationAuditLog = async ({
  organizationId,
  actorId,
  action,
  targetUserId = null,
  targetMembershipId = null,
  targetProjectId = null,
  targetTaskId = null,
  metadata = {}
}) => {
  return auditLogRepository.createAuditLog({
    organizationId,
    actorId,
    action,
    targetUserId,
    targetMembershipId,
    targetProjectId,
    targetTaskId,
    metadata
  });
};

// Retrieve organization audit logs
const getOrganizationAuditLogs = async (
  requesterId,
  organizationId,
  page = 1,
  limit = 20
) => {
  // Validate organization ID
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  // Validate pagination
  page = Number(page);
  limit = Number(limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw createError("Invalid pagination parameters", 400);
  }

  // Check organization
  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  // Check requester membership
  const membership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  // Only owners and admins can view audit logs
  if (!["owner", "admin"].includes(membership.role)) {
    throw createError(
      "You do not have permission to view audit logs",
      403
    );
  }

  const skip = (page - 1) * limit;

  const [auditLogs, total] = await Promise.all([
    auditLogRepository.findAuditLogsByOrganization(
      organizationId,
      limit,
      skip
    ),
    auditLogRepository.countAuditLogsByOrganization(
      organizationId
    )
  ]);

  return {
    auditLogs,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
};

module.exports = {
  recordOrganizationAuditLog,
  getOrganizationAuditLogs
};
