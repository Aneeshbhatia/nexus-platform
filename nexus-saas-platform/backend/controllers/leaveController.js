const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    let employeeId = req.body.employee;

    // If Employee role, enforce their own employee ID
    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(400).json({
          success: false,
          message: "No employee profile is linked to your user account",
        });
      }
      employeeId = req.user.employeeId._id || req.user.employeeId;
    }

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide employee, leave type, start date, end date, and reason",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date provided",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after the end date",
      });
    }

    // Calculate days count inclusive
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping active or pending leave requests
    const overlapping = await Leave.findOne({
      employee: employeeId,
      status: { $in: ["Pending", "Approved"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `An overlapping ${overlapping.status.toLowerCase()} leave request already exists for this date range (${new Date(overlapping.startDate).toLocaleDateString()} - ${new Date(overlapping.endDate).toLocaleDateString()})`,
      });
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount,
      reason: reason.trim(),
      status: "Pending",
    });

    const populatedLeave = await Leave.findById(leave._id).populate({
      path: "employee",
      select: "fullName employeeId designation department",
      populate: { path: "department", select: "name code" },
    });

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: populatedLeave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res, next) => {
  try {
    const { status, type, employeeId, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && type !== "all") {
      query.leaveType = type;
    }

    // Employees can only view their own leave requests
    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
      query.employee = req.user.employeeId._id || req.user.employeeId;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({
        path: "employee",
        select: "fullName employeeId designation department profileImage",
        populate: { path: "department", select: "name code" },
      })
      .populate("actionBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: leaves.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single leave request details
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: "employee",
        select: "fullName employeeId designation department email phone",
        populate: { path: "department", select: "name code" },
      })
      .populate("actionBy", "name email role");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // Role check: Employee can only see their own
    if (
      req.user.role === "Employee" &&
      req.user.employeeId?.toString() !== leave.employee._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this leave request",
      });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject leave request (Admin/HR)
// @route   PUT /api/leaves/:id/status
// @access  Private/HR,Admin
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, actionComment } = req.body;

    if (!status || !["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid status (Approved or Rejected)",
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    leave.status = status;
    leave.actionBy = req.user._id;
    leave.actionAt = new Date();
    if (actionComment !== undefined) {
      leave.actionComment = actionComment.trim();
    }

    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate({
        path: "employee",
        select: "fullName employeeId designation department",
        populate: { path: "department", select: "name code" },
      })
      .populate("actionBy", "name email role");

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully`,
      data: updatedLeave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or cancel leave request
// @route   DELETE /api/leaves/:id
// @access  Private
const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // An employee can only cancel their own Pending request
    if (req.user.role === "Employee") {
      const isOwner =
        req.user.employeeId &&
        req.user.employeeId.toString() === leave.employee.toString();

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You can only cancel your own leave request",
        });
      }

      if (leave.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a leave request that has already been ${leave.status.toLowerCase()}`,
        });
      }
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Leave request cancelled / deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
};
