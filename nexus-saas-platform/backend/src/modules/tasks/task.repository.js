
const Task = require("./task.model");

// Create a new task
const createTask = async (taskData) => {
  return Task.create(taskData);
};

// Find one task inside a specific organization and project
const findTaskById = async (
  taskId,
  organizationId,
  projectId
) => {
  return Task.findOne({
    _id: taskId,
    organizationId,
    projectId
  })
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
};

// Find all tasks belonging to a project
const findTasksByProject = async (
  organizationId,
  projectId,
  filters = {}
) => {
  const query = {
    organizationId,
    projectId
  };

  // Filter by task status
  if (filters.status) {
    query.status = filters.status;
  }

  // Filter by priority
  if (filters.priority) {
    query.priority = filters.priority;
  }

  // Filter by assigned user
  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }

  return Task.find(query)
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar")
    .sort({ createdAt: -1, _id: -1 })
    .lean();
};

// Update a task inside a specific organization and project
const updateTask = async (
  taskId,
  organizationId,
  projectId,
  updateData
) => {
  return Task.findOneAndUpdate(
    {
      _id: taskId,
      organizationId,
      projectId
    },
    {
      $set: updateData
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
};

// Delete a task inside a specific organization and project
const deleteTask = async (
  taskId,
  organizationId,
  projectId
) => {
  return Task.findOneAndDelete({
    _id: taskId,
    organizationId,
    projectId
  });
};

// Find tasks assigned to a particular user
const findTasksAssignedToUser = async (
  organizationId,
  userId,
  filters = {}
) => {
  const query = {
    organizationId,
    assignedTo: userId
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  return Task.find(query)
    .populate("projectId", "name status")
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();
};

// Count tasks belonging to a project
const countTasksByProject = async (
  organizationId,
  projectId,
  filters = {}
) => {
  const query = {
    organizationId,
    projectId
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  return Task.countDocuments(query);
};

module.exports = {
  createTask,
  findTaskById,
  findTasksByProject,
  updateTask,
  deleteTask,
  findTasksAssignedToUser,
  countTasksByProject
};
