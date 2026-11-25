const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = getTodayString();
    const todayDate = new Date();

    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalDepartments,
      presentToday,
      pendingLeaves,
      onLeaveToday,
    ] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ employmentStatus: "Active" }),
      Employee.countDocuments({
        employmentStatus: { $in: ["Inactive", "Terminated"] },
      }),
      Department.countDocuments({ status: "active" }),
      Attendance.countDocuments({
        date: todayStr,
        status: { $in: ["Present", "Late"] },
      }),
      Leave.countDocuments({ status: "Pending" }),
      Leave.countDocuments({
        status: "Approved",
        startDate: { $lte: todayDate },
        endDate: { $gte: todayDate },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        totalDepartments,
        presentToday,
        onLeaveToday,
        pendingLeaves,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics (charts & trends)
// @route   GET /api/dashboard/analytics
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Department-wise employee count
    const departments = await Department.find({ status: "active" }).select("name code");
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ department: dept._id });
        return {
          name: dept.name,
          code: dept.code,
          count,
        };
      })
    );

    // 2. Attendance history over the last 7 days
    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      const [present, late, halfDay, absent] = await Promise.all([
        Attendance.countDocuments({ date: dateStr, status: "Present" }),
        Attendance.countDocuments({ date: dateStr, status: "Late" }),
        Attendance.countDocuments({ date: dateStr, status: "Half-day" }),
        Attendance.countDocuments({ date: dateStr, status: "Absent" }),
      ]);

      attendanceTrends.push({
        date: dateStr,
        label,
        present,
        late,
        halfDay,
        absent,
        total: present + late + halfDay,
      });
    }

    // 3. Employee Joining Trends by Month (last 6 months)
    const joiningTrends = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

      const count = await Employee.countDocuments({
        joiningDate: { $gte: monthDate, $lt: nextMonthDate },
      });

      joiningTrends.push({
        month: monthLabel,
        count,
      });
    }

    // 4. Recent Employee Activity (newest employees, recent leave actions)
    const recentEmployees = await Employee.find({})
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName employeeId designation department employmentStatus joiningDate profileImage")
      .lean();

    const recentLeaves = await Leave.find({})
      .populate("employee", "fullName employeeId designation profileImage")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        departmentDistribution,
        attendanceTrends,
        joiningTrends,
        recentEmployees,
        recentLeaves,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardAnalytics,
};
