const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"],
      required: [true, "Leave type is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    daysCount: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Leave duration must be at least 1 day"],
    },
    reason: {
      type: String,
      required: [true, "Reason for leave is required"],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actionAt: {
      type: Date,
      default: null,
    },
    actionComment: {
      type: String,
      default: "",
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Index for checking active or overlapping leaves
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1, status: 1 });

const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Leave;
