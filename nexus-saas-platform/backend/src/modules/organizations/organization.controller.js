
const organizationService = require("./organization.service");

// Create organization
const createOrganization = async (req, res) => {
  try {
    const organization =
      await organizationService.createOrganization(
        req.auth.userId,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: { organization }
    });
  } catch (error) {
    console.error("Create organization error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Get all organizations
const getMyOrganizations = async (req, res) => {
  try {
    const organizations =
      await organizationService.getUserOrganizations(
        req.auth.userId
      );

    return res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      results: organizations.length,
      data: { organizations }
    });
  } catch (error) {
    console.error("Get organizations error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Get organization details
const getOrganizationDetails = async (req, res) => {
  try {
    const result =
      await organizationService.getOrganizationDetails(
        req.auth.userId,
        req.params.organizationId
      );

    return res.status(200).json({
      success: true,
      message: "Organization details retrieved successfully",
      data: result
    });
  } catch (error) {
    console.error("Get organization details error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const organization =
      await organizationService.updateOrganization(
        req.auth.userId,
        req.params.organizationId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: { organization }
    });
  } catch (error) {
    console.error("Update organization error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Get organization members
const getOrganizationMembers = async (req, res) => {
  try {
    const members =
      await organizationService.getOrganizationMembers(
        req.auth.userId,
        req.params.organizationId
      );

    return res.status(200).json({
      success: true,
      message: "Organization members retrieved successfully",
      results: members.length,
      data: { members }
    });
  } catch (error) {
    console.error("Get organization members error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

module.exports = {
  createOrganization,
  getMyOrganizations,
  getOrganizationDetails,
  updateOrganization,
  getOrganizationMembers
};
