const express = require("express");
const {
  checkIn,
  checkOut,
  getAttendance,
  getEmployeeAttendance,
  getTodayStatus,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.get("/today/status", protect, getTodayStatus);
router.get("/", protect, getAttendance);
router.get("/:employeeId", protect, getEmployeeAttendance);

module.exports = router;
