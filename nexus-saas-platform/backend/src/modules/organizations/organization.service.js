
const mongoose = require("mongoose");

const organizationRepository = require("./organization.repository");
const membershipRepository = require("../memberships/membership.repository");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Create organization
const createOrganization = async (userId, organizationData) => {
  const { name, description } = organizationData;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 150
  ) {
    throw createError(
      "Organization name must be between 2 and 150 characters",
      400
    );
  }

  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    throw createError(
      "Organization name cannot generate a valid slug",
      400
    );
  }

  let slug = baseSlug;
  let counter = 1;

  while (
    await organizationRepository.findOrganizationBySlug(slug)
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  let organization;

  try {
    organization = await organizationRepository.createOrganization({
      name: name.trim(),
      slug,
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      createdBy: userId
    });

    await membershipRepository.createMembership({
      userId,
      organizationId: organization._id,
      role: "owner",
      status: "active"
    });

    return organization;
  } catch (error) {
    if (organization?._id) {
      try {
        await organizationRepository.deleteOrganization(
          organization._id
        );
      } catch (rollbackError) {
        console.error(
          "Organization rollback failed:",
          rollbackError.message
        );
      }
    }

    if (error.code === 11000) {
      throw createError(
        "Organization already exists or slug is unavailable",
        409
      );
    }

    throw error;
  }
};

// Get all organizations of current user
const getUserOrganizations = async (userId) => {
  const memberships =
    await membershipRepository.findMembershipsByUser(userId);

  return memberships
    .filter((membership) => membership.organizationId)
    .map((membership) => ({
      organization: membership.organizationId,
      role: membership.role,
      membershipStatus: membership.status,
      joinedAt: membership.joinedAt
    }));
};

// Get individual organization details
const getOrganizationDetails = async (
  userId,
  organizationId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError(
      "Organization not found or access denied",
      404
    );
  }

  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

  if (!organization || organization.status !== "active") {
    throw createError(
      "Organization not found or access denied",
      404
    );
  }

  return {
    organization,
    membership: {
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt
    }
  };
};

// Update organization
const updateOrganization = async (
  userId,
  organizationId,
  updateData
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError(
      "Organization not found or access denied",
      404
    );
  }

  if (!["owner", "admin"].includes(membership.role)) {
    throw createError(
      "You do not have permission to update this organization",
      403
    );
  }

  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const allowedUpdates = {};

  if (updateData.name !== undefined) {
    allowedUpdates.name = updateData.name.trim();
  }

  if (updateData.description !== undefined) {
    allowedUpdates.description = updateData.description.trim();
  }

  if (updateData.logo !== undefined) {
    allowedUpdates.logo = updateData.logo;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw createError(
      "No valid fields provided for update",
      400
    );
  }

  return organizationRepository.updateOrganization(
    organizationId,
    allowedUpdates
  );
};

// Get organization members
const getOrganizationMembers = async (
  userId,
  organizationId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  // Check whether requester belongs to organization
  const requesterMembership =
    await membershipRepository.findMembership(
      userId,
      organizationId
    );

  if (
    !requesterMembership ||
    requesterMembership.status !== "active"
  ) {
    throw createError(
      "Organization not found or access denied",
      404
    );
  }

  // Check organization status
  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  // Retrieve members
  const memberships =
    await membershipRepository.findMembersByOrganization(
      organizationId
    );

  return memberships.map((membership) => ({
    membershipId: membership._id,
    user: membership.userId,
    role: membership.role,
    status: membership.status,
    joinedAt: membership.joinedAt
  }));
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationDetails,
  updateOrganization,
  getOrganizationMembers
};
