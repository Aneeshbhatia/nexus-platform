
const express = require("express");

const organizationController = require("./organization.controller");

const {
  validateCreateOrganization,
  validateUpdateOrganization
} = require("./organization.validation");

const { authenticate } = require("../auth/auth.middleware");

const router = express.Router();

// Get all organizations
router.get(
  "/",
  authenticate,
  organizationController.getMyOrganizations
);

// Create organization
router.post(
  "/",
  authenticate,
  validateCreateOrganization,
  organizationController.createOrganization
);

// Get organization details
router.get(
  "/:organizationId",
  authenticate,
  organizationController.getOrganizationDetails
);

// Update organization
router.patch(
  "/:organizationId",
  authenticate,
  validateUpdateOrganization,
  organizationController.updateOrganization
);

// Get organization members
router.get(
  "/:organizationId/members",
  authenticate,
  organizationController.getOrganizationMembers
);

module.exports = router;
