
const commentService = require("./comment.service");

// CREATE COMMENT OR REPLY
const createComment = async (req, res, next) => {
  try {
    const comment = await commentService.createComment(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// GET TASK COMMENTS
const getTaskComments = async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;

    const result = await commentService.getTaskComments(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      results: result.comments.length,
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// GET COMMENT REPLIES
const getCommentReplies = async (req, res, next) => {
  try {
    const replies = await commentService.getCommentReplies(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.params.commentId
    );

    return res.status(200).json({
      success: true,
      message: "Comment replies retrieved successfully",
      results: replies.length,
      data: replies
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE COMMENT
const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.params.commentId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// DELETE COMMENT
const deleteComment = async (req, res, next) => {
  try {
    const comment = await commentService.deleteComment(
      req.auth.userId,
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.params.commentId
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getTaskComments,
  getCommentReplies,
  updateComment,
  deleteComment
};
