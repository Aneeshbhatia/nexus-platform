
const express = require("express");

const auditLogController = require("./auditLog.controller");
const { authenticate } = require("../auth/auth.middleware");

const {
  validateOrganizationId
} = require("../memberships/membership.validation");

const router = express.Router();

// Get organization audit logs
router.get(
  "/:organizationId/audit-logs",
  authenticate,
  validateOrganizationId,
  auditLogController.getOrganizationAuditLogs
);

module.exports = router;
