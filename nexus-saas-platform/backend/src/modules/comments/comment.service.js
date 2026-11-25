
const mongoose = require("mongoose");

const commentRepository = require("./comment.repository");
const membershipRepository = require("../memberships/membership.repository");
const organizationRepository = require("../organizations/organization.repository");
const projectRepository = require("../projects/project.repository");
const taskRepository = require("../tasks/task.repository");

// Helper: create application errors
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate IDs
const validateIds = (organizationId, projectId, taskId) => {
  if (!mongoose.isValidObjectId(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project ID", 400);
  }

  if (!mongoose.isValidObjectId(taskId)) {
    throw createError("Invalid task ID", 400);
  }
};

// Verify active organization membership and task access
const getCommentContext = async (
  userId,
  organizationId,
  projectId,
  taskId
) => {
  validateIds(organizationId, projectId, taskId);

  const organization =
    await organizationRepository.findOrganizationById(
      organizationId
    );

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

  const task = await taskRepository.findTaskById(
    taskId,
    organizationId,
    projectId
  );

  if (!task) {
    throw createError("Task not found", 404);
  }

  return {
    organization,
    membership,
    project,
    task
  };
};

// CREATE COMMENT OR REPLY
const createComment = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  commentData
) => {
  await getCommentContext(
    requesterId,
    organizationId,
    projectId,
    taskId
  );

  let parentCommentId = commentData.parentCommentId || null;

  // Verify parent comment when creating a reply
  if (parentCommentId) {
    if (!mongoose.isValidObjectId(parentCommentId)) {
      throw createError("Invalid parent comment ID", 400);
    }

    const parentComment =
      await commentRepository.findCommentById(
        parentCommentId,
        organizationId,
        projectId,
        taskId
      );

    if (!parentComment || parentComment.isDeleted) {
      throw createError("Parent comment not found", 404);
    }
  }

  const comment = await commentRepository.createComment({
    organizationId,
    projectId,
    taskId,
    authorId: requesterId,
    content: commentData.content,
    parentCommentId
  });

  return comment;
};

// GET TOP-LEVEL COMMENTS
const getTaskComments = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  page = 1,
  limit = 20
) => {
  await getCommentContext(
    requesterId,
    organizationId,
    projectId,
    taskId
  );

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    commentRepository.findCommentsByTask(
      organizationId,
      projectId,
      taskId,
      limit,
      skip
    ),
    commentRepository.countCommentsByTask(
      organizationId,
      projectId,
      taskId
    )
  ]);

  return {
    comments,
    pagination: {
      currentPage: page,
      limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
};

// GET REPLIES
const getCommentReplies = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  commentId
) => {
  await getCommentContext(
    requesterId,
    organizationId,
    projectId,
    taskId
  );

  if (!mongoose.isValidObjectId(commentId)) {
    throw createError("Invalid comment ID", 400);
  }

  const parentComment =
    await commentRepository.findCommentById(
      commentId,
      organizationId,
      projectId,
      taskId
    );

  if (!parentComment || parentComment.isDeleted) {
    throw createError("Comment not found", 404);
  }

  return commentRepository.findRepliesByParentComment(
    commentId,
    organizationId,
    projectId,
    taskId
  );
};

// UPDATE COMMENT
const updateComment = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  commentId,
  updateData
) => {
  await getCommentContext(
    requesterId,
    organizationId,
    projectId,
    taskId
  );

  if (!mongoose.isValidObjectId(commentId)) {
    throw createError("Invalid comment ID", 400);
  }

  const comment = await commentRepository.findCommentById(
    commentId,
    organizationId,
    projectId,
    taskId
  );

  if (!comment || comment.isDeleted) {
    throw createError("Comment not found", 404);
  }

  if (comment.authorId._id.toString() !== requesterId.toString()) {
    throw createError(
      "Only the comment author can edit this comment",
      403
    );
  }

  return commentRepository.updateComment(
    commentId,
    organizationId,
    projectId,
    taskId,
    {
      content: updateData.content,
      editedAt: new Date()
    }
  );
};

// SOFT DELETE COMMENT
const deleteComment = async (
  requesterId,
  organizationId,
  projectId,
  taskId,
  commentId
) => {
  const { membership } = await getCommentContext(
    requesterId,
    organizationId,
    projectId,
    taskId
  );

  if (!mongoose.isValidObjectId(commentId)) {
    throw createError("Invalid comment ID", 400);
  }

  const comment = await commentRepository.findCommentById(
    commentId,
    organizationId,
    projectId,
    taskId
  );

  if (!comment || comment.isDeleted) {
    throw createError("Comment not found", 404);
  }

  const isAuthor =
    comment.authorId._id.toString() === requesterId.toString();

  const isOrganizationAdmin = [
    "owner",
    "admin"
  ].includes(membership.role);

  if (!isAuthor && !isOrganizationAdmin) {
    throw createError(
      "You do not have permission to delete this comment",
      403
    );
  }

  return commentRepository.deleteComment(
    commentId,
    organizationId,
    projectId,
    taskId,
    requesterId
  );
};

module.exports = {
  createComment,
  getTaskComments,
  getCommentReplies,
  updateComment,
  deleteComment
};
