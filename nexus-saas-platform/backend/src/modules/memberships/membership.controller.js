
const membershipService = require("./membership.service");

// Invite a member
const inviteMember = async (req, res) => {
  try {
    const membership = await membershipService.inviteMember(
      req.auth.userId,
      req.params.organizationId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Organization invitation created successfully",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const membership = await membershipService.acceptInvitation(
      req.auth.userId,
      req.params.organizationId
    );

    return res.status(200).json({
      success: true,
      message: "Organization invitation accepted",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Reject invitation
const rejectInvitation = async (req, res) => {
  try {
    const membership = await membershipService.rejectInvitation(
      req.auth.userId,
      req.params.organizationId
    );

    return res.status(200).json({
      success: true,
      message: "Organization invitation rejected",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Get pending invitations
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await membershipService.getMyInvitations(
      req.auth.userId
    );

    return res.status(200).json({
      success: true,
      message: "Invitations retrieved successfully",
      results: invitations.length,
      data: { invitations }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Update member role
const updateMemberRole = async (req, res) => {
  try {
    const membership = await membershipService.updateMemberRole(
      req.auth.userId,
      req.params.organizationId,
      req.params.membershipId,
      req.body.role
    );

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Remove member
const removeMember = async (req, res) => {
  try {
    const membership = await membershipService.removeMember(
      req.auth.userId,
      req.params.organizationId,
      req.params.membershipId
    );

    return res.status(200).json({
      success: true,
      message: "Member removed from organization successfully",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

// Restore suspended member
const restoreMember = async (req, res) => {
  try {
    const membership = await membershipService.restoreMember(
      req.auth.userId,
      req.params.organizationId,
      req.params.membershipId
    );

    return res.status(200).json({
      success: true,
      message: "Member restored to organization successfully",
      data: { membership }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  getMyInvitations,
  updateMemberRole,
  removeMember,
  restoreMember
};
