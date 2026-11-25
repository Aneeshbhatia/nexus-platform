
const express = require("express");

const taskController = require("./task.controller");

const { authenticate } = require("../auth/auth.middleware");

const {
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateTaskId,
  validateCreateTask,
  validateUpdateTask
} = require("./task.validation");

const router = express.Router();

// GET MY ASSIGNED TASKS
router.get(
  "/organizations/:organizationId/my-tasks",
  authenticate,
  validateTaskOrganizationId,
  taskController.getMyTasks
);

// CREATE TASK
router.post(
  "/organizations/:organizationId/projects/:projectId/tasks",
  authenticate,
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateCreateTask,
  taskController.createTask
);

// GET ALL TASKS FOR A PROJECT
router.get(
  "/organizations/:organizationId/projects/:projectId/tasks",
  authenticate,
  validateTaskOrganizationId,
  validateTaskProjectId,
  taskController.getProjectTasks
);

// GET SINGLE TASK
router.get(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId",
  authenticate,
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateTaskId,
  taskController.getTaskDetails
);

// UPDATE TASK
router.patch(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId",
  authenticate,
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateTaskId,
  validateUpdateTask,
  taskController.updateTask
);

// DELETE TASK
router.delete(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId",
  authenticate,
  validateTaskOrganizationId,
  validateTaskProjectId,
  validateTaskId,
  taskController.deleteTask
);

module.exports = router;
