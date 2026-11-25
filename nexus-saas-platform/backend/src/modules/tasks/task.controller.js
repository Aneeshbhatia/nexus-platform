
const taskService = require("./task.service");

// CREATE TASK
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PROJECT TASKS
const getProjectTasks = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assignedTo: req.query.assignedTo
    };

    // Remove undefined or empty filters
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) {
        delete filters[key];
      }
    });

    const tasks = await taskService.getProjectTasks(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      filters
    );

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      results: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// GET TASK DETAILS
const getTaskDetails = async (req, res, next) => {
  try {
    const task = await taskService.getTaskDetails(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId
    );

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE TASK
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// DELETE TASK
const deleteTask = async (req, res, next) => {
  try {
    const task = await taskService.deleteTask(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// GET MY ASSIGNED TASKS
const getMyTasks = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority
    };

    Object.keys(filters).forEach((key) => {
      if (!filters[key]) {
        delete filters[key];
      }
    });

    const tasks = await taskService.getMyTasks(
      req.auth.userId,
      req.params.organizationId,
      filters
    );

    return res.status(200).json({
      success: true,
      message: "Your assigned tasks retrieved successfully",
      results: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskDetails,
  updateTask,
  deleteTask,
  getMyTasks
};
