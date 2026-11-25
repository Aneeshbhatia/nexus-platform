
const AuditLog = require("./auditLog.model");

// Create audit log
const createAuditLog = async (auditData) => {
  return AuditLog.create(auditData);
};

// Find audit logs by organization
const findAuditLogsByOrganization = async (
  organizationId,
  limit = 20,
  skip = 0
) => {
  return AuditLog.find({ organizationId })
    .populate("actorId", "name email avatar")
    .populate("targetUserId", "name email avatar")
    .populate("targetMembershipId")
    .populate("targetProjectId", "name status")
    .populate("targetTaskId", "title status priority")
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Count organization audit logs
const countAuditLogsByOrganization = async (organizationId) => {
  return AuditLog.countDocuments({ organizationId });
};

// Find audit log by ID and organization
const findAuditLogById = async (
  auditLogId,
  organizationId
) => {
  return AuditLog.findOne({
    _id: auditLogId,
    organizationId
  })
    .populate("actorId", "name email avatar")
    .populate("targetUserId", "name email avatar")
    .populate("targetMembershipId")
    .populate("targetProjectId", "name status")
    .populate("targetTaskId", "title status priority")
    .lean();
};

module.exports = {
  createAuditLog,
  findAuditLogsByOrganization,
  countAuditLogsByOrganization,
  findAuditLogById
};
