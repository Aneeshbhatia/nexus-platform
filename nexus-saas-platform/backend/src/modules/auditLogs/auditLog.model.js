
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Organization where the action occurred
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      immutable: true
    },

    // User who performed the action
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },

    // Type of action performed
    action: {
      type: String,
      required: true,
      enum: [
        // Membership events
        "member.invited",
        "invitation.accepted",
        "invitation.rejected",
        "member.role_updated",
        "member.removed",
        "member.restored",

        // Project events
        "project.created",
        "project.updated",
        "project.archived",

        // Task events
        "task.created",
        "task.updated",
        "task.assigned",
        "task.status_changed",
        "task.completed",
        "task.deleted"
      ],
      immutable: true
    },

    // Affected user
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      immutable: true
    },

    // Affected membership
    targetMembershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
      immutable: true
    },

    // Affected project
    targetProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      immutable: true
    },

    // Affected task
    targetTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      immutable: true
    },

    // Additional event information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      immutable: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Organization audit history
auditLogSchema.index({
  organizationId: 1,
  createdAt: -1
});

// Actor activity history
auditLogSchema.index({
  actorId: 1,
  createdAt: -1
});

// Project audit history
auditLogSchema.index({
  targetProjectId: 1,
  createdAt: -1
});

// Task audit history
auditLogSchema.index({
  targetTaskId: 1,
  createdAt: -1
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
