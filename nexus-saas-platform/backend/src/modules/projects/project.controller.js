
const projectService = require("./project.service");

// ==========================================
// 1. CREATE PROJECT
// ==========================================

const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(
      req.auth.userId,
      req.params.organizationId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// ==========================================
// 2. GET ORGANIZATION PROJECTS
// ==========================================

const getOrganizationProjects = async (req, res) => {
  try {
    const projects = await projectService.getOrganizationProjects(
      req.auth.userId,
      req.params.organizationId,
      {
        status: req.query.status,
        includeArchived: req.query.includeArchived === "true"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      count: projects.length,
      data: projects
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// ==========================================
// 3. GET PROJECT DETAILS
// ==========================================

const getProjectDetails = async (req, res) => {
  try {
    const project = await projectService.getProjectDetails(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId
    );

    return res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// ==========================================
// 4. UPDATE PROJECT
// ==========================================

const updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// ==========================================
// 5. ARCHIVE PROJECT
// ==========================================

const archiveProject = async (req, res) => {
  try {
    const project = await projectService.archiveProject(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId
    );

    return res.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: project
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createProject,
  getOrganizationProjects,
  getProjectDetails,
  updateProject,
  archiveProject
};
