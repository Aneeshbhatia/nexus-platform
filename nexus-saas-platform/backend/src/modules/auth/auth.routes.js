
const express = require("express");

const authController = require("./auth.controller");

const {
  validateRegister,
  validateLogin
} = require("./auth.validation");

const { authenticate } = require("./auth.middleware");

const router = express.Router();

// Public routes
router.post(
  "/register",
  validateRegister,
  authController.register
);

router.post(
  "/login",
  validateLogin,
  authController.login
);

// Protected route
router.get(
  "/me",
  authenticate,
  authController.getMe
);

// Refresh access token using refresh cookie
router.post(
  "/refresh",
  authController.refresh
);

// Logout and revoke refresh session
router.post(
  "/logout",
  authController.logout
);

module.exports = router;
