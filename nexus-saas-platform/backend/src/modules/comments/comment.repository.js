
const Comment = require("./comment.model");

// Create a new comment or reply
const createComment = async (commentData) => {
  return Comment.create(commentData);
};

// Find a comment by ID within its organization, project and task
const findCommentById = async (
  commentId,
  organizationId,
  projectId,
  taskId
) => {
  return Comment.findOne({
    _id: commentId,
    organizationId,
    projectId,
    taskId
  })
    .populate("authorId", "name email avatar")
    .populate("deletedBy", "name email avatar");
};

// Retrieve top-level comments for a task
const findCommentsByTask = async (
  organizationId,
  projectId,
  taskId,
  limit = 20,
  skip = 0
) => {
  return Comment.find({
    organizationId,
    projectId,
    taskId,
    parentCommentId: null
  })
    .populate("authorId", "name email avatar")
    .sort({ createdAt: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Retrieve replies belonging to a comment
const findRepliesByParentComment = async (
  parentCommentId,
  organizationId,
  projectId,
  taskId
) => {
  return Comment.find({
    parentCommentId,
    organizationId,
    projectId,
    taskId
  })
    .populate("authorId", "name email avatar")
    .sort({ createdAt: 1, _id: 1 })
    .lean();
};

// Update comment content
const updateComment = async (
  commentId,
  organizationId,
  projectId,
  taskId,
  updateData
) => {
  return Comment.findOneAndUpdate(
    {
      _id: commentId,
      organizationId,
      projectId,
      taskId,
      isDeleted: false
    },
    {
      $set: updateData
    },
    {
      new: true,
      runValidators: true
    }
  ).populate("authorId", "name email avatar");
};

// Soft-delete a comment
const deleteComment = async (
  commentId,
  organizationId,
  projectId,
  taskId,
  deletedBy
) => {
  return Comment.findOneAndUpdate(
    {
      _id: commentId,
      organizationId,
      projectId,
      taskId,
      isDeleted: false
    },
    {
      $set: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date()
      }
    },
    {
      new: true
    }
  );
};

// Count top-level comments for pagination
const countCommentsByTask = async (
  organizationId,
  projectId,
  taskId
) => {
  return Comment.countDocuments({
    organizationId,
    projectId,
    taskId,
    parentCommentId: null
  });
};

module.exports = {
  createComment,
  findCommentById,
  findCommentsByTask,
  findRepliesByParentComment,
  updateComment,
  deleteComment,
  countCommentsByTask
};
