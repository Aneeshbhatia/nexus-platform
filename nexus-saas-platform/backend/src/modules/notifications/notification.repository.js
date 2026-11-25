
const Notification = require("./notification.model");

// Create a notification
const createNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

// Find a notification by ID and recipient
const findNotificationById = async (notificationId, recipientId, organizationId) => {
  return await Notification.findOne({
    _id: notificationId,
    recipientId,
    organizationId
  })
    .populate("actorId", "name email avatar")
    .lean();
};

// Get notifications for a recipient
const findNotificationsByRecipient = async (
  recipientId,
  organizationId,
  filters = {}
) => {
  const query = {
    recipientId,
    organizationId
  };

  if (typeof filters.isRead === "boolean") {
    query.isRead = filters.isRead;
  }

  return await Notification.find(query)
    .populate("actorId", "name email avatar")
    .sort({ createdAt: -1, _id: -1 })
    .skip(filters.skip || 0)
    .limit(filters.limit || 20)
    .lean();
};

// Count all notifications for a recipient
const countNotificationsByRecipient = async (
  recipientId,
  organizationId,
  filters = {}
) => {
  const query = {
    recipientId,
    organizationId
  };

  if (typeof filters.isRead === "boolean") {
    query.isRead = filters.isRead;
  }

  return await Notification.countDocuments(query);
};

// Count unread notifications
const countUnreadNotifications = async (
  recipientId,
  organizationId
) => {
  return await Notification.countDocuments({
    recipientId,
    organizationId,
    isRead: false
  });
};

// Mark one notification as read
const markNotificationAsRead = async (
  notificationId,
  recipientId,
  organizationId
) => {
  return await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipientId,
      organizationId
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate("actorId", "name email avatar")
    .lean();
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (
  recipientId,
  organizationId
) => {
  return await Notification.updateMany(
    {
      recipientId,
      organizationId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Delete one notification
const deleteNotification = async (
  notificationId,
  recipientId,
  organizationId
) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId,
    organizationId
  });
};

// Delete all notifications for a recipient
const deleteAllNotifications = async (
  recipientId,
  organizationId
) => {
  return await Notification.deleteMany({
    recipientId,
    organizationId
  });
};

module.exports = {
  createNotification,
  findNotificationById,
  findNotificationsByRecipient,
  countNotificationsByRecipient,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
};
