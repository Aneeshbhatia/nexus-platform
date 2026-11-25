const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// Helper: Get today's normalized date string YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// @desc    Employee check-in for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    let employeeId = req.body.employeeId;

    // If Employee role, use their attached employeeId
    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(400).json({
          success: false,
          message: "No employee record is linked to your user account",
        });
      }
      employeeId = req.user.employeeId._id || req.user.employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required for check-in",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const todayStr = getTodayString();
    const now = new Date();

    // Check if attendance already recorded today
    let record = await Attendance.findOne({
      employee: employee._id,
      date: todayStr,
    });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `Employee has already checked in today at ${new Date(record.checkIn).toLocaleTimeString()}`,
        data: record,
      });
    }

    // Determine if late (e.g., after 9:30 AM local)
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 30);
    const initialStatus = isLate ? "Late" : "Present";

    if (record) {
      record.checkIn = now;
      record.status = initialStatus;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: employee._id,
        date: todayStr,
        checkIn: now,
        status: initialStatus,
        notes: isLate ? "Late arrival check-in" : "On-time arrival",
      });
    }

    const populatedRecord = await Attendance.findById(record._id).populate(
      "employee",
      "fullName employeeId designation department"
    );

    res.status(200).json({
      success: true,
      message: `Check-in recorded successfully at ${now.toLocaleTimeString()}`,
      data: populatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Employee check-out for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    let employeeId = req.body.employeeId;

    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(400).json({
          success: false,
          message: "No employee record is linked to your user account",
        });
      }
      employeeId = req.user.employeeId._id || req.user.employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required for check-out",
      });
    }

    const todayStr = getTodayString();
    const now = new Date();

    const record = await Attendance.findOne({
      employee: employeeId,
      date: todayStr,
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Cannot check out without an active check-in record for today",
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `Employee has already checked out today at ${new Date(record.checkOut).toLocaleTimeString()}`,
        data: record,
      });
    }

    record.checkOut = now;

    // Calculate duration in hours rounded to 2 decimal places
    const diffMs = now.getTime() - new Date(record.checkIn).getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    record.workingHours = Math.max(0, hours);

    // If worked less than 4.5 hours, classify as Half-day
    if (record.workingHours < 4.5 && record.status !== "Absent") {
      record.status = "Half-day";
    }

    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate(
      "employee",
      "fullName employeeId designation department"
    );

    res.status(200).json({
      success: true,
      message: `Check-out recorded successfully. Total working hours: ${record.workingHours} hrs`,
      data: populatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance records (with filters)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res, next) => {
  try {
    const { date, status, employeeId, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by date
    if (date) {
      query.date = date;
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // If Employee, lock to their own records only
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

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate({
        path: "employee",
        select: "fullName employeeId designation department profileImage",
        populate: { path: "department", select: "name code" },
      })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee attendance history
// @route   GET /api/attendance/:employeeId
// @access  Private
const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    if (
      req.user.role === "Employee" &&
      req.user.employeeId?.toString() !== employeeId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own attendance history",
      });
    }

    const records = await Attendance.find({ employee: employeeId })
      .populate({
        path: "employee",
        select: "fullName employeeId designation department",
        populate: { path: "department", select: "name code" },
      })
      .sort({ date: -1 })
      .limit(31)
      .lean();

    // Calculate summary statistics
    const totalPresent = records.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;
    const totalLate = records.filter((r) => r.status === "Late").length;
    const totalHalfDay = records.filter((r) => r.status === "Half-day").length;
    const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);

    res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        totalDaysRecorded: records.length,
        totalPresent,
        totalLate,
        totalHalfDay,
        totalHours: Math.round(totalHours * 10) / 10,
        averageHoursPerDay:
          totalPresent > 0 ? Math.round((totalHours / totalPresent) * 10) / 10 : 0,
      },
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's check-in status for current user
// @route   GET /api/attendance/today/status
// @access  Private
const getTodayStatus = async (req, res, next) => {
  try {
    const todayStr = getTodayString();
    let employeeId = null;

    if (req.user.employeeId) {
      employeeId = req.user.employeeId._id || req.user.employeeId;
    } else {
      // Find matching employee by user's email
      const emp = await Employee.findOne({ email: req.user.email });
      if (emp) employeeId = emp._id;
    }

    if (!employeeId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No employee linked to current user",
      });
    }

    const record = await Attendance.findOne({
      employee: employeeId,
      date: todayStr,
    }).populate("employee", "fullName employeeId designation");

    res.status(200).json({
      success: true,
      data: record,
      today: todayStr,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getEmployeeAttendance,
  getTodayStatus,
};
