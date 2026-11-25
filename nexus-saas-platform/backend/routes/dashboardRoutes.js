const express = require("express");
const {
  getDashboardStats,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/analytics", protect, getDashboardAnalytics);

module.exports = router;
