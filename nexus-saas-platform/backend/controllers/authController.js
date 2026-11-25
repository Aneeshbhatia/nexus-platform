const User = require("../models/User");
const Employee = require("../models/Employee");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if this is the first user; if so, assign Admin role automatically
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const assignedRole = isFirstAccount ? "Admin" : role || "Employee";

    // Check if an employee with this email already exists to link
    const matchingEmployee = await Employee.findOne({
      email: email.toLowerCase().trim(),
    });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      employeeId: matchingEmployee ? matchingEmployee._id : null,
    });

    if (matchingEmployee && !matchingEmployee.user) {
      matchingEmployee.user = user._id;
      await matchingEmployee.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+password")
      .populate("employeeId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact your system administrator",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: "employeeId",
        populate: { path: "department", select: "name code" },
      });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.avatar) user.avatar = req.body.avatar;

    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match",
        });
      }
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }
      user.password = req.body.newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate({
        path: "employeeId",
        select: "employeeId fullName designation department",
        populate: { path: "department", select: "name code" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role & status (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent removing the last Admin
    if (user.role === "Admin" && role && role !== "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin", status: "active" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot change role. At least one active Admin is required in the system",
        });
      }
    }

    if (role && ["Admin", "HR Manager", "Employee"].includes(role)) {
      user.role = role;
    }

    if (status && ["active", "inactive"].includes(status)) {
      user.status = status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
};
