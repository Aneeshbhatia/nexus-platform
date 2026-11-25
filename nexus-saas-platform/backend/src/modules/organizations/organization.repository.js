
const Organization = require("./organization.model");

// Create organization
const createOrganization = async (organizationData) => {
  return Organization.create(organizationData);
};

// Find organization by ID
const findOrganizationById = async (organizationId) => {
  return Organization.findById(organizationId);
};

// Find organization by slug
const findOrganizationBySlug = async (slug) => {
  return Organization.findOne({ slug });
};

// Find organizations created by a user
const findOrganizationsByCreator = async (userId) => {
  return Organization.find({ createdBy: userId })
    .sort({ createdAt: -1 });
};

// Update organization
const updateOrganization = async (
  organizationId,
  updateData
) => {
  return Organization.findByIdAndUpdate(
    organizationId,
    { $set: updateData },
    {
      new: true,
      runValidators: true
    }
  );
};

// Delete organization
const deleteOrganization = async (organizationId) => {
  return Organization.findByIdAndDelete(organizationId);
};

module.exports = {
  createOrganization,
  findOrganizationById,
  findOrganizationBySlug,
  findOrganizationsByCreator,
  updateOrganization,
  deleteOrganization
};
