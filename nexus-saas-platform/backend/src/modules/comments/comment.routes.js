
const express = require("express");

const commentController = require("./comment.controller");

const { authenticate } = require("../auth/auth.middleware");

const {
  validateCommentParams,
  validateCommentId,
  validateCreateComment,
  validateUpdateComment,
  validateCommentPagination
} = require("./comment.validation");

const router = express.Router();

// CREATE COMMENT OR REPLY
router.post(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments",
  authenticate,
  validateCommentParams,
  validateCreateComment,
  commentController.createComment
);

// GET TASK COMMENTS
router.get(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments",
  authenticate,
  validateCommentParams,
  validateCommentPagination,
  commentController.getTaskComments
);

// GET COMMENT REPLIES
router.get(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments/:commentId/replies",
  authenticate,
  validateCommentParams,
  validateCommentId,
  commentController.getCommentReplies
);

// UPDATE COMMENT
router.patch(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments/:commentId",
  authenticate,
  validateCommentParams,
  validateCommentId,
  validateUpdateComment,
  commentController.updateComment
);

// DELETE COMMENT
router.delete(
  "/organizations/:organizationId/projects/:projectId/tasks/:taskId/comments/:commentId",
  authenticate,
  validateCommentParams,
  validateCommentId,
  commentController.deleteComment
);

module.exports = router;
