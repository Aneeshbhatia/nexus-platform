const express = require("express");
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getEmployees)
  .post(protect, authorize("Admin", "HR Manager"), createEmployee);

router
  .route("/:id")
  .get(protect, getEmployeeById)
  .put(protect, authorize("Admin", "HR Manager"), updateEmployee)
  .delete(protect, authorize("Admin", "HR Manager"), deleteEmployee);

module.exports = router;
