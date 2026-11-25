
const express = require("express");

const projectController = require("./project.controller");

const { authenticate } = require("../auth/auth.middleware");

const {
  validateCreateProject,
  validateUpdateProject,
  validateProjectOrganizationId,
  validateProjectId
} = require("./project.validation");

const router = express.Router();

// ==========================================
// 1. CREATE PROJECT
// ==========================================

router.post(
  "/organizations/:organizationId/projects",
  authenticate,
  validateProjectOrganizationId,
  validateCreateProject,
  projectController.createProject
);

// ==========================================
// 2. GET ALL ORGANIZATION PROJECTS
// ==========================================

router.get(
  "/organizations/:organizationId/projects",
  authenticate,
  validateProjectOrganizationId,
  projectController.getOrganizationProjects
);

// ==========================================
// 3. GET PROJECT DETAILS
// ==========================================

router.get(
  "/organizations/:organizationId/projects/:projectId",
  authenticate,
  validateProjectOrganizationId,
  validateProjectId,
  projectController.getProjectDetails
);

// ==========================================
// 4. UPDATE PROJECT
// ==========================================

router.patch(
  "/organizations/:organizationId/projects/:projectId",
  authenticate,
  validateProjectOrganizationId,
  validateProjectId,
  validateUpdateProject,
  projectController.updateProject
);

// ==========================================
// 5. ARCHIVE PROJECT
// ==========================================

router.patch(
  "/organizations/:organizationId/projects/:projectId/archive",
  authenticate,
  validateProjectOrganizationId,
  validateProjectId,
  projectController.archiveProject
);

module.exports = router;
