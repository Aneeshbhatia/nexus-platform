const express = require("express");
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getDepartments)
  .post(protect, authorize("Admin", "HR Manager"), createDepartment);

router
  .route("/:id")
  .get(protect, getDepartmentById)
  .put(protect, authorize("Admin", "HR Manager"), updateDepartment)
  .delete(protect, authorize("Admin", "HR Manager"), deleteDepartment);

module.exports = router;
