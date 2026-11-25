
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: 2,
      maxlength: 150
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    logo: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Organization = mongoose.model(
  "Organization",
  organizationSchema
);

module.exports = Organization;
