
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Organization that owns the comment
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      immutable: true
    },

    // Project associated with the comment
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      immutable: true
    },

    // Task being discussed
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      immutable: true
    },

    // User who wrote the comment
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },

    // Comment content
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: 1,
      maxlength: 5000
    },

    // Parent comment for threaded replies
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      immutable: true
    },

    // Soft deletion
    isDeleted: {
      type: Boolean,
      default: false
    },

    // User who deleted the comment
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    deletedAt: {
      type: Date,
      default: null
    },

    // User who last edited the comment
    editedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Retrieve comments belonging to a task
commentSchema.index({
  organizationId: 1,
  projectId: 1,
  taskId: 1,
  createdAt: -1
});

// Retrieve comments written by a user
commentSchema.index({
  organizationId: 1,
  authorId: 1,
  createdAt: -1
});

// Retrieve replies belonging to a parent comment
commentSchema.index({
  parentCommentId: 1,
  createdAt: 1
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
