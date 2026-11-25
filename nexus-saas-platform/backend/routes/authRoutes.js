const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

// Admin-only user management routes
router.get("/users", protect, authorize("Admin"), getAllUsers);
router.put("/users/:id/role", protect, authorize("Admin"), updateUserRole);

module.exports = router;
