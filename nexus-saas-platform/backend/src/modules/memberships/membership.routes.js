const express = require("express");

const membershipController = require("./membership.controller");
const { authenticate } = require("../auth/auth.middleware");

const {
  validateInviteMember,
  validateUpdateMemberRole,
  validateOrganizationId,
  validateMembershipId
} = require("./membership.validation");

const router = express.Router();

// Get pending invitations (supports both /api/v1/invitations and /api/v1/memberships/invitations)
router.get(
  ["/invitations", "/memberships/invitations"],
  authenticate,
  membershipController.getMyInvitations
);

// Invite a registered user
router.post(
  "/organizations/:organizationId/invitations",
  authenticate,
  validateOrganizationId,
  validateInviteMember,
  membershipController.inviteMember
);

// Accept invitation
router.patch(
  "/organizations/:organizationId/invitations/accept",
  authenticate,
  validateOrganizationId,
  membershipController.acceptInvitation
);

// Reject invitation
router.patch(
  "/organizations/:organizationId/invitations/reject",
  authenticate,
  validateOrganizationId,
  membershipController.rejectInvitation
);

// Update member role
router.patch(
  "/organizations/:organizationId/members/:membershipId/role",
  authenticate,
  validateOrganizationId,
  validateMembershipId,
  validateUpdateMemberRole,
  membershipController.updateMemberRole
);

// Remove member
router.delete(
  "/organizations/:organizationId/members/:membershipId",
  authenticate,
  validateOrganizationId,
  validateMembershipId,
  membershipController.removeMember
);

// Restore suspended member
router.patch(
  "/organizations/:organizationId/members/:membershipId/restore",
  authenticate,
  validateOrganizationId,
  validateMembershipId,
  membershipController.restoreMember
);

module.exports = router;
