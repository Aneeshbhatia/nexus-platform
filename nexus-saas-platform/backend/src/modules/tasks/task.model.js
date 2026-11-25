
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // Organization that owns the task
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    // Project to which the task belongs
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    // Task title
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: 2,
      maxlength: 200
    },

    // Task description
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },

    // User who created the task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // User responsible for the task
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Task status
    status: {
      type: String,
      enum: [
        "todo",
        "in_progress",
        "in_review",
        "completed",
        "cancelled"
      ],
      default: "todo",
      required: true
    },

    // Task priority
    priority: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
        "urgent"
      ],
      default: "medium",
      required: true
    },

    // Task deadline
    dueDate: {
      type: Date,
      default: null
    },

    // Completion timestamp
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ==========================================
// DATABASE INDEXES
// ==========================================

// Retrieve tasks belonging to a project
taskSchema.index({
  organizationId: 1,
  projectId: 1,
  createdAt: -1
});

// Retrieve tasks assigned to a particular user
taskSchema.index({
  organizationId: 1,
  assignedTo: 1,
  status: 1
});

// Filter tasks by project and status
taskSchema.index({
  organizationId: 1,
  projectId: 1,
  status: 1
});

// ==========================================
// MODEL
// ==========================================

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
