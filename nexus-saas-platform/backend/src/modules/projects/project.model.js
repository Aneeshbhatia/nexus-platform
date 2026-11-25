
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Organization that owns this project
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    // Project name
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: 2,
      maxlength: 150
    },

    // Project description
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    // User who created the project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Current project status
    status: {
      type: String,
      enum: [
        "planned",
        "active",
        "on_hold",
        "completed",
        "archived"
      ],
      default: "planned",
      required: true
    },

    // Project start date
    startDate: {
      type: Date,
      default: null
    },

    // Project deadline
    dueDate: {
      type: Date,
      default: null
    },

    // Archive information
    archivedAt: {
      type: Date,
      default: null
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Efficient organization-level project queries
projectSchema.index({
  organizationId: 1,
  createdAt: -1
});

// Filter projects by organization and status
projectSchema.index({
  organizationId: 1,
  status: 1
});

// Validate project dates
projectSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.dueDate &&
    this.dueDate < this.startDate
  ) {
    this.invalidate(
      "dueDate",
      "Due date cannot be earlier than the start date"
    );
  }
});

// Create model
const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
