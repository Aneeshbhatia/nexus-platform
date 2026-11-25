
const notificationService = require("./notification.service");

// GET: All my notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications(
      req.auth.userId,
      req.params.organizationId,
      req.query.page || 1,
      req.query.limit || 20,
      req.query.isRead
    );

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// GET: Unread notification count
const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadCount =
      await notificationService.getUnreadNotificationCount(
        req.auth.userId,
        req.params.organizationId
      );

    res.status(200).json({
      success: true,
      message: "Unread notification count retrieved successfully",
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark one notification as read
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification =
      await notificationService.markNotificationAsRead(
        req.auth.userId,
        req.params.organizationId,
        req.params.notificationId
      );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark all notifications as read
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result =
      await notificationService.markAllNotificationsAsRead(
        req.auth.userId,
        req.params.organizationId
      );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Delete one notification
const deleteMyNotification = async (req, res, next) => {
  try {
    await notificationService.deleteMyNotification(
      req.auth.userId,
      req.params.organizationId,
      req.params.notificationId
    );

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Delete all notifications
const deleteAllMyNotifications = async (req, res, next) => {
  try {
    const result =
      await notificationService.deleteAllMyNotifications(
        req.auth.userId,
        req.params.organizationId
      );

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteMyNotification,
  deleteAllMyNotifications
};
