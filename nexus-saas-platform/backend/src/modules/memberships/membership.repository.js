
const Membership = require("./membership.model");

// Create membership
const createMembership = async (membershipData) => {
  return Membership.create(membershipData);
};

// Find membership by user and organization
const findMembership = async (userId, organizationId) => {
  return Membership.findOne({
    userId,
    organizationId
  });
};

// Find membership by membership ID and organization
const findMembershipById = async (membershipId, organizationId) => {
  return Membership.findOne({
    _id: membershipId,
    organizationId
  });
};

// Find all active memberships of a user
const findMembershipsByUser = async (userId) => {
  return Membership.find({
    userId,
    status: "active"
  })
    .populate({
      path: "organizationId",
      select: "name slug description logo status createdAt"
    })
    .sort({ createdAt: -1 });
};

// Find all active members of an organization
const findMembersByOrganization = async (organizationId) => {
  return Membership.find({
    organizationId,
    status: "active"
  })
    .populate("userId", "name email avatar")
    .sort({ createdAt: -1 });
};

// Find pending invitations for a user
const findPendingInvitationsByUser = async (userId) => {
  return Membership.find({
    userId,
    status: "invited"
  })
    .populate("organizationId", "name slug logo")
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });
};

// Update membership
const updateMembership = async (membershipId, updateData) => {
  return Membership.findByIdAndUpdate(
    membershipId,
    { $set: updateData },
    {
      new: true,
      runValidators: true
    }
  );
};

// Delete membership
const deleteMembership = async (membershipId) => {
  return Membership.findByIdAndDelete(membershipId);
};

module.exports = {
  createMembership,
  findMembership,
  findMembershipById,
  findMembershipsByUser,
  findMembersByOrganization,
  findPendingInvitationsByUser,
  updateMembership,
  deleteMembership
};
