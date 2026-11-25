
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      immutable: true,
      index: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      immutable: true
    },

    type: {
      type: String,
      enum: [
        "task.assigned",
        "task.updated",
        "task.status_changed",
        "comment.created",
        "comment.replied",
        "project.updated",
        "member.invited",
        "invitation.accepted"
      ],
      required: true,
      immutable: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      immutable: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      immutable: true
    },

    entityType: {
      type: String,
      enum: [
        "task",
        "comment",
        "project",
        "membership"
      ],
      default: null,
      immutable: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      immutable: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Recipient notification listing
notificationSchema.index({
  organizationId: 1,
  recipientId: 1,
  createdAt: -1
});

// Unread notification queries
notificationSchema.index({
  organizationId: 1,
  recipientId: 1,
  isRead: 1,
  createdAt: -1
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

module.exports = Notification;
