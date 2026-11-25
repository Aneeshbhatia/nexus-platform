
const mongoose = require("mongoose");

const membershipRepository = require("./membership.repository");
const authRepository = require("../auth/auth.repository");
const organizationRepository = require("../organizations/organization.repository");
const auditLogService = require("../auditLogs/auditLog.service");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ==========================================
// 1. Invite a registered user
// ==========================================

const inviteMember = async (requesterId, organizationId, invitationData) => {
  const { email, role = "member" } = invitationData;

  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!["admin", "manager", "member"].includes(role)) {
    throw createError("Invalid invitation role", 400);
  }

  const requesterMembership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!requesterMembership || requesterMembership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  if (!["owner", "admin"].includes(requesterMembership.role)) {
    throw createError("You do not have permission to invite members", 403);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const invitedUser = await authRepository.findUserByEmail(
    email.trim().toLowerCase()
  );

  if (!invitedUser) {
    throw createError("No registered user found with this email", 404);
  }

  if (invitedUser.status !== "active") {
    throw createError("User account is unavailable", 403);
  }

  if (invitedUser._id.equals(requesterId)) {
    throw createError("You cannot invite yourself", 400);
  }

  const existingMembership = await membershipRepository.findMembership(
    invitedUser._id,
    organizationId
  );

  if (existingMembership) {
    if (existingMembership.status === "active") {
      throw createError(
        "User is already a member of this organization",
        409
      );
    }

    if (existingMembership.status === "invited") {
      throw createError("An invitation is already pending", 409);
    }

    if (existingMembership.status === "rejected") {
      throw createError("This invitation was previously rejected", 409);
    }

    throw createError("This user's membership is suspended", 403);
  }

  const membership = await membershipRepository.createMembership({
    userId: invitedUser._id,
    organizationId,
    role,
    status: "invited",
    invitedBy: requesterId,
    joinedAt: null
  });

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "member.invited",
    targetUserId: invitedUser._id,
    targetMembershipId: membership._id,
    metadata: {
      role,
      email: invitedUser.email
    }
  });

  return membership;
};

// ==========================================
// 2. Accept an invitation
// ==========================================

const acceptInvitation = async (userId, organizationId) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "invited") {
    throw createError("No pending invitation found", 404);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization is unavailable", 404);
  }

  const updatedMembership = await membershipRepository.updateMembership(
    membership._id,
    {
      status: "active",
      joinedAt: new Date()
    }
  );

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: userId,
    action: "invitation.accepted",
    targetUserId: userId,
    targetMembershipId: membership._id,
    metadata: {
      role: membership.role
    }
  });

  return updatedMembership;
};

// ==========================================
// 3. Reject an invitation
// ==========================================

const rejectInvitation = async (userId, organizationId) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "invited") {
    throw createError("No pending invitation found", 404);
  }

  const updatedMembership = await membershipRepository.updateMembership(
    membership._id,
    {
      status: "rejected",
      joinedAt: null
    }
  );

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: userId,
    action: "invitation.rejected",
    targetUserId: userId,
    targetMembershipId: membership._id,
    metadata: {
      role: membership.role
    }
  });

  return updatedMembership;
};

// ==========================================
// 4. Get current user's invitations
// ==========================================

const getMyInvitations = async (userId) => {
  return membershipRepository.findPendingInvitationsByUser(userId);
};

// ==========================================
// 5. Update a member's role
// ==========================================

const updateMemberRole = async (
  requesterId,
  organizationId,
  membershipId,
  newRole
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!mongoose.isValidObjectId(membershipId)) {
    throw createError("Invalid membership ID", 400);
  }

  if (!["admin", "manager", "member"].includes(newRole)) {
    throw createError("Invalid role", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const requesterMembership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!requesterMembership || requesterMembership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  if (!["owner", "admin"].includes(requesterMembership.role)) {
    throw createError(
      "You do not have permission to change member roles",
      403
    );
  }

  const target = await membershipRepository.findMembershipById(
    membershipId,
    organizationId
  );

  if (!target || target.status !== "active") {
    throw createError("Active organization member not found", 404);
  }

  if (target.userId.toString() === requesterId.toString()) {
    throw createError("You cannot change your own role", 403);
  }

  if (target.role === "owner") {
    throw createError(
      "The organization owner's role cannot be changed",
      403
    );
  }

  if (requesterMembership.role === "admin" && target.role === "admin") {
    throw createError(
      "Admins cannot change another admin's role",
      403
    );
  }

  if (target.role === newRole) {
    throw createError("Member already has this role", 400);
  }

  const oldRole = target.role;

  const updatedMembership = await membershipRepository.updateMembership(
    target._id,
    {
      role: newRole
    }
  );

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "member.role_updated",
    targetUserId: target.userId,
    targetMembershipId: target._id,
    metadata: {
      oldRole,
      newRole
    }
  });

  return updatedMembership;
};

// ==========================================
// 6. Remove a member
// ==========================================

const removeMember = async (
  requesterId,
  organizationId,
  membershipId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!mongoose.isValidObjectId(membershipId)) {
    throw createError("Invalid membership ID", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const requesterMembership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!requesterMembership || requesterMembership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  if (!["owner", "admin"].includes(requesterMembership.role)) {
    throw createError(
      "You do not have permission to remove members",
      403
    );
  }

  const target = await membershipRepository.findMembershipById(
    membershipId,
    organizationId
  );

  if (!target || target.status !== "active") {
    throw createError("Active organization member not found", 404);
  }

  if (target.userId.toString() === requesterId.toString()) {
    throw createError("You cannot remove yourself", 403);
  }

  if (target.role === "owner") {
    throw createError("The organization owner cannot be removed", 403);
  }

  if (requesterMembership.role === "admin" && target.role === "admin") {
    throw createError("Admins cannot remove another admin", 403);
  }

  const updatedMembership = await membershipRepository.updateMembership(
    target._id,
    {
      status: "suspended"
    }
  );

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "member.removed",
    targetUserId: target.userId,
    targetMembershipId: target._id,
    metadata: {
      role: target.role,
      previousStatus: "active",
      newStatus: "suspended"
    }
  });

  return updatedMembership;
};

// ==========================================
// 7. Restore a suspended member
// ==========================================

const restoreMember = async (
  requesterId,
  organizationId,
  membershipId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!mongoose.isValidObjectId(membershipId)) {
    throw createError("Invalid membership ID", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const requesterMembership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!requesterMembership || requesterMembership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  if (!["owner", "admin"].includes(requesterMembership.role)) {
    throw createError(
      "You do not have permission to restore members",
      403
    );
  }

  const target = await membershipRepository.findMembershipById(
    membershipId,
    organizationId
  );

  if (!target || target.status !== "suspended") {
    throw createError("Suspended membership not found", 404);
  }

  if (target.role === "owner") {
    throw createError(
      "Organization owner cannot be restored through this endpoint",
      403
    );
  }

  if (requesterMembership.role === "admin" && target.role === "admin") {
    throw createError(
      "Admins cannot restore another admin",
      403
    );
  }

  // Only change status. Preserve the original role and joinedAt.
  const updatedMembership = await membershipRepository.updateMembership(
    target._id,
    {
      status: "active"
    }
  );

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "member.restored",
    targetUserId: target.userId,
    targetMembershipId: target._id,
    metadata: {
      role: target.role,
      previousStatus: "suspended",
      newStatus: "active"
    }
  });

  return updatedMembership;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  getMyInvitations,
  updateMemberRole,
  removeMember,
  restoreMember
};
