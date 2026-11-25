const Department = require("../models/Department");
const Employee = require("../models/Employee");

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/HR,Admin
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, head, location, budget, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required",
      });
    }

    const existingCode = await Department.findOne({
      $or: [
        { code: code.toUpperCase().trim() },
        { name: name.trim() },
      ],
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Department with this name or code already exists",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description ? description.trim() : "",
      head: head || null,
      location: location || "Main Office",
      budget: budget || 0,
      status: status || "active",
    });

    const populatedDept = await Department.findById(department._id).populate(
      "head",
      "fullName designation email"
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: populatedDept,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all departments (with employee counts)
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({})
      .populate("head", "fullName designation email profileImage")
      .sort({ name: 1 })
      .lean();

    // Compute live employee counts for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          department: dept._id,
        });
        return {
          ...dept,
          employeeCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: departmentsWithCounts.length,
      data: departmentsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("head", "fullName designation email phone profileImage")
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const employeeCount = await Employee.countDocuments({
      department: department._id,
    });

    const employees = await Employee.find({ department: department._id })
      .select("employeeId fullName designation email phone employmentStatus")
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...department,
        employeeCount,
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/HR,Admin
const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description, head, location, budget, status } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check for duplicate code or name on other departments
    if (code || name) {
      const duplicate = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          code ? { code: code.toUpperCase().trim() } : null,
          name ? { name: name.trim() } : null,
        ].filter(Boolean),
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another department with this name or code already exists",
        });
      }
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.toUpperCase().trim();
    if (description !== undefined) department.description = description.trim();
    if (head !== undefined) department.head = head || null;
    if (location !== undefined) department.location = location;
    if (budget !== undefined) department.budget = Number(budget);
    if (status) department.status = status;

    await department.save();

    const updatedDept = await Department.findById(department._id).populate(
      "head",
      "fullName designation email"
    );

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDept,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/HR,Admin
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if there are employees assigned to this department
    const assignedEmployeesCount = await Employee.countDocuments({
      department: department._id,
    });

    if (assignedEmployeesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department '${department.name}'. There are currently ${assignedEmployeesCount} employee(s) assigned to it. Please reassign the employees first.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
