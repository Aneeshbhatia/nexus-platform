const express = require("express");

const notificationController = require("./notification.controller");
const { authenticate } = require("../auth/auth.middleware");
const {
  validateNotificationOrgId,
  validateNotificationId,
  validateNotificationQuery
} = require("./notification.validation");

const router = express.Router();

// Get all notifications
router.get(
  "/organizations/:organizationId/notifications",
  authenticate,
  validateNotificationOrgId,
  validateNotificationQuery,
  notificationController.getMyNotifications
);

// Get unread notification count
router.get(
  "/organizations/:organizationId/notifications/unread-count",
  authenticate,
  validateNotificationOrgId,
  notificationController.getUnreadNotificationCount
);

// Mark one notification as read
router.patch(
  "/organizations/:organizationId/notifications/:notificationId/read",
  authenticate,
  validateNotificationOrgId,
  validateNotificationId,
  notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch(
  "/organizations/:organizationId/notifications/read-all",
  authenticate,
  validateNotificationOrgId,
  notificationController.markAllNotificationsAsRead
);

// Delete one notification
router.delete(
  "/organizations/:organizationId/notifications/:notificationId",
  authenticate,
  validateNotificationOrgId,
  validateNotificationId,
  notificationController.deleteMyNotification
);

// Delete all notifications
router.delete(
  "/organizations/:organizationId/notifications",
  authenticate,
  validateNotificationOrgId,
  notificationController.deleteAllMyNotifications
);

module.exports = router;
