const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const User = require("../models/User");

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/HR,Admin
const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId,
      fullName,
      email,
      phone,
      gender,
      dob,
      department,
      designation,
      salary,
      joiningDate,
      employmentType,
      employmentStatus,
      address,
      profileImage,
    } = req.body;

    if (
      !employeeId ||
      !fullName ||
      !email ||
      !phone ||
      !gender ||
      !dob ||
      !department ||
      !designation ||
      salary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    // Check duplicate employee ID
    const existingId = await Employee.findOne({
      employeeId: employeeId.toUpperCase().trim(),
    });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${employeeId}' is already in use`,
      });
    }

    // Check duplicate email
    const existingEmail = await Employee.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "An employee with this email already exists",
      });
    }

    // Verify department exists
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: "Selected department does not exist",
      });
    }

    // Check if a user account exists with this email to link
    const matchingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    const employee = await Employee.create({
      employeeId: employeeId.toUpperCase().trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      gender,
      dob: new Date(dob),
      department,
      designation: designation.trim(),
      salary: Number(salary),
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      employmentType: employmentType || "Full-time",
      employmentStatus: employmentStatus || "Active",
      address: address || {},
      profileImage: profileImage || "",
      user: matchingUser ? matchingUser._id : null,
    });

    if (matchingUser && !matchingUser.employeeId) {
      matchingUser.employeeId = employee._id;
      await matchingUser.save();
    }

    const populatedEmployee = await Employee.findById(employee._id).populate(
      "department",
      "name code"
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: populatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees with search, filters, pagination and sorting
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res, next) => {
  try {
    const {
      search,
      department,
      status,
      type,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
      exportCSV,
    } = req.query;

    const query = {};

    // Search by full name, email, employeeId, or designation
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { designation: searchRegex },
      ];
    }

    // Filter by department
    if (department && department !== "all") {
      query.department = department;
    }

    // Filter by employment status
    if (status && status !== "all") {
      query.employmentStatus = status;
    }

    // Filter by employment type
    if (type && type !== "all") {
      query.employmentType = type;
    }

    // Sorting
    const sortField = sort;
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // CSV export mode: return all matching records without pagination
    if (exportCSV === "true") {
      const allEmployees = await Employee.find(query)
        .populate("department", "name code")
        .sort(sortOption)
        .lean();

      return res.status(200).json({
        success: true,
        data: allEmployees,
      });
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate("department", "name code")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("department", "name code location budget")
      .populate("user", "name email role status")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Non-HR/Admin employees can only view their own profile
    if (
      req.user.role === "Employee" &&
      req.user.employeeId?.toString() !== employee._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are only permitted to view your own employee profile",
      });
    }

    // Recent attendance summary
    const recentAttendance = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    // Recent leave history
    const recentLeaves = await Leave.find({ employee: employee._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...employee,
        recentAttendance,
        recentLeaves,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/HR,Admin
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    const {
      fullName,
      email,
      phone,
      gender,
      dob,
      department,
      designation,
      salary,
      joiningDate,
      employmentType,
      employmentStatus,
      address,
      profileImage,
    } = req.body;

    // Check unique email if modified
    if (email && email.toLowerCase().trim() !== employee.email) {
      const emailExists = await Employee.findOne({
        _id: { $ne: req.params.id },
        email: email.toLowerCase().trim(),
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another employee",
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    // Verify department if updated
    if (department && department !== employee.department.toString()) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({
          success: false,
          message: "Selected department does not exist",
        });
      }
      employee.department = department;
    }

    if (fullName) employee.fullName = fullName.trim();
    if (phone) employee.phone = phone.trim();
    if (gender) employee.gender = gender;
    if (dob) employee.dob = new Date(dob);
    if (designation) employee.designation = designation.trim();
    if (salary !== undefined) employee.salary = Number(salary);
    if (joiningDate) employee.joiningDate = new Date(joiningDate);
    if (employmentType) employee.employmentType = employmentType;
    if (employmentStatus) employee.employmentStatus = employmentStatus;
    if (address) employee.address = address;
    if (profileImage !== undefined) employee.profileImage = profileImage;

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id).populate(
      "department",
      "name code"
    );

    res.status(200).json({
      success: true,
      message: "Employee details updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/HR,Admin
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or already removed",
      });
    }

    // Clean up or unlink references
    await Department.updateMany(
      { head: employee._id },
      { $set: { head: null } }
    );
    await User.updateMany(
      { employeeId: employee._id },
      { $set: { employeeId: null } }
    );
    await Attendance.deleteMany({ employee: employee._id });
    await Leave.deleteMany({ employee: employee._id });

    await Employee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Employee '${employee.fullName}' (${employee.employeeId}) and associated records have been removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
