
const mongoose = require("mongoose");

const projectRepository = require("./project.repository");
const membershipRepository = require("../memberships/membership.repository");
const organizationRepository = require("../organizations/organization.repository");
const auditLogService = require("../auditLogs/auditLog.service");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ==========================================
// COMMON: VALIDATE ORGANIZATION ACCESS
// ==========================================

const getActiveOrganizationMembership = async (
  userId,
  organizationId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  return membership;
};

// ==========================================
// COMMON: CHECK PROJECT MANAGEMENT PERMISSION
// ==========================================

const checkProjectManagementPermission = (membership) => {
  if (!["owner", "admin", "manager"].includes(membership.role)) {
    throw createError(
      "You do not have permission to manage projects",
      403
    );
  }
};

// ==========================================
// 1. CREATE PROJECT
// ==========================================

const createProject = async (
  requesterId,
  organizationId,
  projectData
) => {
  const membership = await getActiveOrganizationMembership(
    requesterId,
    organizationId
  );

  checkProjectManagementPermission(membership);

  const { startDate, dueDate } = projectData;

  if (startDate && dueDate && dueDate < startDate) {
    throw createError(
      "Due date cannot be earlier than the start date",
      400
    );
  }

  const project = await projectRepository.createProject({
    ...projectData,
    organizationId,
    createdBy: requesterId
  });

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "project.created",
    targetProjectId: project._id,
    metadata: {
      name: project.name,
      status: project.status
    }
  });

  return project;
};

// ==========================================
// 2. GET ALL ORGANIZATION PROJECTS
// ==========================================

const getOrganizationProjects = async (
  requesterId,
  organizationId,
  filters = {}
) => {
  await getActiveOrganizationMembership(
    requesterId,
    organizationId
  );

  const allowedStatuses = [
    "planned",
    "active",
    "on_hold",
    "completed"
  ];

  if (
    filters.status &&
    !allowedStatuses.includes(filters.status)
  ) {
    throw createError("Invalid project status", 400);
  }

  return projectRepository.findProjectsByOrganization(
    organizationId,
    {
      status: filters.status,
      includeArchived: filters.includeArchived === true
    }
  );
};

// ==========================================
// 3. GET PROJECT DETAILS
// ==========================================

const getProjectDetails = async (
  requesterId,
  organizationId,
  projectId
) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project ID", 400);
  }

  await getActiveOrganizationMembership(
    requesterId,
    organizationId
  );

  const project = await projectRepository.findProjectById(
    projectId,
    organizationId
  );

  if (!project || project.status === "archived") {
    throw createError("Project not found", 404);
  }

  return project;
};

// ==========================================
// 4. UPDATE PROJECT
// ==========================================

const updateProject = async (
  requesterId,
  organizationId,
  projectId,
  updateData
) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project ID", 400);
  }

  const membership = await getActiveOrganizationMembership(
    requesterId,
    organizationId
  );

  checkProjectManagementPermission(membership);

  const existingProject = await projectRepository.findProjectById(
    projectId,
    organizationId
  );

  if (!existingProject || existingProject.status === "archived") {
    throw createError("Project not found", 404);
  }

  const resultingStartDate = Object.prototype.hasOwnProperty.call(
    updateData,
    "startDate"
  )
    ? updateData.startDate
    : existingProject.startDate;

  const resultingDueDate = Object.prototype.hasOwnProperty.call(
    updateData,
    "dueDate"
  )
    ? updateData.dueDate
    : existingProject.dueDate;

  if (
    resultingStartDate &&
    resultingDueDate &&
    resultingDueDate < resultingStartDate
  ) {
    throw createError(
      "Due date cannot be earlier than the start date",
      400
    );
  }

  const updatedProject = await projectRepository.updateProject(
    projectId,
    organizationId,
    updateData
  );

  if (!updatedProject) {
    throw createError("Project not found or already archived", 404);
  }

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "project.updated",
    targetProjectId: updatedProject._id,
    metadata: {
      changedFields: Object.keys(updateData),
      previousValues: {
        name: existingProject.name,
        status: existingProject.status
      },
      newValues: {
        name: updatedProject.name,
        status: updatedProject.status
      }
    }
  });

  return updatedProject;
};

// ==========================================
// 5. ARCHIVE PROJECT
// ==========================================

const archiveProject = async (
  requesterId,
  organizationId,
  projectId
) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project ID", 400);
  }

  const membership = await getActiveOrganizationMembership(
    requesterId,
    organizationId
  );

  if (!["owner", "admin"].includes(membership.role)) {
    throw createError(
      "Only organization owners and admins can archive projects",
      403
    );
  }

  const existingProject = await projectRepository.findProjectById(
    projectId,
    organizationId
  );

  if (!existingProject || existingProject.status === "archived") {
    throw createError("Project not found or already archived", 404);
  }

  const archivedProject = await projectRepository.archiveProject(
    projectId,
    organizationId,
    requesterId
  );

  if (!archivedProject) {
    throw createError("Project not found or already archived", 404);
  }

  await auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId: requesterId,
    action: "project.archived",
    targetProjectId: archivedProject._id,
    metadata: {
      projectName: existingProject.name,
      previousStatus: existingProject.status,
      newStatus: "archived"
    }
  });

  return archivedProject;
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
