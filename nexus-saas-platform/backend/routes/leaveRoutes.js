const express = require("express");
const {
  applyLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
} = require("../controllers/leaveController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getLeaves)
  .post(protect, applyLeave);

router
  .route("/:id")
  .get(protect, getLeaveById)
  .delete(protect, deleteLeave);

router.put(
  "/:id/status",
  protect,
  authorize("Admin", "HR Manager"),
  updateLeaveStatus
);

module.exports = router;
