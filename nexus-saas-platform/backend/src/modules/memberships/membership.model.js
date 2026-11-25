
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "member"],
      default: "member",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended", "rejected"],
      default: "active"
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    joinedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

membershipSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true }
);

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;
