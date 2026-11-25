
const mongoose = require("mongoose");

const taskRepository = require("./task.repository");
const membershipRepository = require("../memberships/membership.repository");
const organizationRepository = require("../organizations/organization.repository");
const projectRepository = require("../projects/project.repository");
const auditLogService = require("../auditLogs/auditLog.service");

// Helper: create consistent application errors
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Check organization membership and project access
const getActiveOrganizationContext = async (
  userId,
  organizationId,
  projectId
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project ID", 400);
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

  const project = await projectRepository.findProjectById(
    projectId,
    organizationId
  );

  if (!project || project.status === "archived") {
    throw createError("Project not found", 404);
  }

  return { organization, membership, project };
};

// Check task management permission
const checkTaskManagementPermission = (membership) => {
  const allowedRoles = ["owner", "admin", "manager"];

  if (!allowedRoles.includes(membership.role)) {
    throw createError(
      "You do not have permission to manage tasks",
      403
    );
  }
};

// Verify that an assignee is an active organization member
const validateAssignee = async (assignedTo, organizationId) => {
  if (!assignedTo) {
    return null;
  }

  if (!mongoose.isValidObjectId(assignedTo)) {
    throw createError("Invalid assigned user ID", 400);
  }

  const assigneeMembership =
    await membershipRepository.findMembership(
      assignedTo,
      organizationId
    );

  if (
    !assigneeMembership ||
    assigneeMembership.status !== "active"
  ) {
    throw createError(
      "Assigned user is not an active member of this organization",
      400
    );
  }

  return assignedTo;
};

// Helper: record task audit event
const recordTaskAudit = async ({
  organizationId,
  actorId,
  action,
  projectId,
  taskId,
  metadata = {},
  targetUserId = null
}) => {
  return auditLogService.recordOrganizationAuditLog({
    organizationId,
    actorId,
    action,
    targetUserId,
    targetProjectId: projectId,
    targetTaskId: taskId,
    metadata
  });
};

// CREATE TASK
const createTask = async (
  requesterId,
  organizationId,
  projectId,
  taskData
) => {
  const { membership } = await getActiveOrganizationContext(
    requesterId,
    organizationId,
    projectId
  );

  checkTaskManagementPermission(membership);

  const assignedTo = await validateAssignee(
    taskData.assignedTo,
    organizationId
  );

  const task = await taskRepository.createTask({
    ...taskData,
    organizationId,
    projectId,
    createdBy: requesterId,
    assignedTo,
    completedAt:
      taskData.status === "completed" ? new Date() : null
  });

  await recordTaskAudit({
    organizationId,
    actorId: requesterId,
    action: "task.created",
    projectId,
    taskId: task._id,
    metadata: {
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo
    },
    targetUserId: task.assignedTo
  });

  return task;
};

// GET ALL TASKS FOR A PROJECT
const getProjectTasks = async (
  requesterId,
  organizationId,
  projectId,
  filters = {}
) => {
  await getActiveOrganizationContext(
    requesterId,
    organizationId,
    projectId
  );

  return taskRepository.findTasksByProject(
    organizationId,
    projectId,
    filters
  );
};

// GET TASK DETAILS
const getTaskDetails = async (
  requesterId,
  organizationId,
  projectId,
  taskId
) => {
  await getActiveOrganizationContext(
    requesterId,
    organizationId,
    projectId
  );

  if (!mongoose.isValidObjectId(taskId)) {
    throw createError("Invalid task ID", 400);
  }

  const task = await taskRepository.findTaskById(
    taskId,
    organizationId,
    projectId
  );

  if (!task) {
    throw createError("Task not found", 404);
  }

  return task;
};

// UPDATE TASK
const updateTask = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  updateData
) => {
  const { membership } = await getActiveOrganizationContext(
    requesterId,
    organizationId,
    projectId
  );

  if (!mongoose.isValidObjectId(taskId)) {
    throw createError("Invalid task ID", 400);
  }

  const task = await taskRepository.findTaskById(
    taskId,
    organizationId,
    projectId
  );

  if (!task) {
    throw createError("Task not found", 404);
  }

  const canManageTasks = [
    "owner",
    "admin",
    "manager"
  ].includes(membership.role);

  const isAssignedUser =
    task.assignedTo &&
    task.assignedTo._id.toString() === requesterId.toString();

  // Assigned members can only update their task status
  if (!canManageTasks) {
    if (!isAssignedUser) {
      throw createError(
        "You do not have permission to update this task",
        403
      );
    }

    const requestedFields = Object.keys(updateData);

    const hasDisallowedField = requestedFields.some(
      (field) => field !== "status"
    );

    if (hasDisallowedField) {
      throw createError(
        "Assigned members can only update task status",
        403
      );
    }
  }

  const previousStatus = task.status;
  const previousAssignee = task.assignedTo
    ? task.assignedTo._id.toString()
    : null;

  // Validate new assignee
  if (Object.hasOwn(updateData, "assignedTo")) {
    updateData.assignedTo = await validateAssignee(
      updateData.assignedTo,
      organizationId
    );
  }

  // Manage completion timestamp
  if (Object.hasOwn(updateData, "status")) {
    updateData.completedAt =
      updateData.status === "completed"
        ? new Date()
        : null;
  }

  const updatedTask = await taskRepository.updateTask(
    taskId,
    organizationId,
    projectId,
    updateData
  );

  if (!updatedTask) {
    throw createError("Task not found", 404);
  }

  const newStatus = updatedTask.status;
  const newAssignee = updatedTask.assignedTo
    ? updatedTask.assignedTo._id.toString()
    : null;

  // Record assignment changes
  if (
    Object.hasOwn(updateData, "assignedTo") &&
    previousAssignee !== newAssignee
  ) {
    await recordTaskAudit({
      organizationId,
      actorId: requesterId,
      action: "task.assigned",
      projectId,
      taskId,
      targetUserId: updatedTask.assignedTo
        ? updatedTask.assignedTo._id
        : null,
      metadata: {
        previousAssignee,
        newAssignee
      }
    });
  }

  // Record status changes
  if (
    Object.hasOwn(updateData, "status") &&
    previousStatus !== newStatus
  ) {
    const isCompleted = newStatus === "completed";

    await recordTaskAudit({
      organizationId,
      actorId: requesterId,
      action: isCompleted
        ? "task.completed"
        : "task.status_changed",
      projectId,
      taskId,
      metadata: {
        previousStatus,
        newStatus
      }
    });
  }

  // Record general task updates
  const changedFields = Object.keys(updateData).filter(
    (field) => field !== "completedAt"
  );

  const hasGeneralChanges = changedFields.some(
    (field) => field !== "assignedTo" && field !== "status"
  );

  if (hasGeneralChanges) {
    await recordTaskAudit({
      organizationId,
      actorId: requesterId,
      action: "task.updated",
      projectId,
      taskId,
      metadata: {
        changedFields,
        title: updatedTask.title,
        priority: updatedTask.priority
      }
    });
  }

  return updatedTask;
};

// DELETE TASK
const deleteTask = async (
  requesterId,
  organizationId,
  projectId,
  taskId
) => {
  const { membership } = await getActiveOrganizationContext(
    requesterId,
    organizationId,
    projectId
  );

  if (!["owner", "admin"].includes(membership.role)) {
    throw createError(
      "Only owners and admins can delete tasks",
      403
    );
  }

  if (!mongoose.isValidObjectId(taskId)) {
    throw createError("Invalid task ID", 400);
  }

  // Fetch task before deletion for audit metadata
  const task = await taskRepository.findTaskById(
    taskId,
    organizationId,
    projectId
  );

  if (!task) {
    throw createError("Task not found", 404);
  }

  const deletedTask = await taskRepository.deleteTask(
    taskId,
    organizationId,
    projectId
  );

  if (!deletedTask) {
    throw createError("Task not found", 404);
  }

  await recordTaskAudit({
    organizationId,
    actorId: requesterId,
    action: "task.deleted",
    projectId,
    taskId,
    metadata: {
      title: task.title,
      previousStatus: task.status,
      previousPriority: task.priority
    },
    targetUserId: task.assignedTo
      ? task.assignedTo._id
      : null
  });

  return deletedTask;
};

// GET TASKS ASSIGNED TO CURRENT USER
const getMyTasks = async (
  requesterId,
  organizationId,
  filters = {}
) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found", 404);
  }

  const membership = await membershipRepository.findMembership(
    requesterId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError("Organization access denied", 403);
  }

  return taskRepository.findTasksAssignedToUser(
    organizationId,
    requesterId,
    filters
  );
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskDetails,
  updateTask,
  deleteTask,
  getMyTasks
};
