
const mongoose = require("mongoose");

const notificationRepository = require("./notification.repository");
const membershipRepository = require("../memberships/membership.repository");
const organizationRepository = require("../organizations/organization.repository");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate MongoDB ObjectIds
const validateIds = ({ organizationId, notificationId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw createError("Invalid organization ID", 400);
  }

  if (
    notificationId &&
    !mongoose.Types.ObjectId.isValid(notificationId)
  ) {
    throw createError("Invalid notification ID", 400);
  }
};

// Verify that the requester belongs to an active organization
const getNotificationContext = async (userId, organizationId) => {
  validateIds({ organizationId });

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found or inactive", 404);
  }

  const membership = await membershipRepository.findMembership(
    userId,
    organizationId
  );

  if (!membership || membership.status !== "active") {
    throw createError("Active organization membership required", 403);
  }

  return { organization, membership };
};

// Internal notification creation
// Called by other backend modules when events occur
const createNotification = async (notificationData) => {
  const {
    organizationId,
    recipientId,
    actorId = null
  } = notificationData;

  validateIds({ organizationId });

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    throw createError("Invalid notification recipient ID", 400);
  }

  if (
    actorId !== null &&
    !mongoose.Types.ObjectId.isValid(actorId)
  ) {
    throw createError("Invalid notification actor ID", 400);
  }

  const organization =
    await organizationRepository.findOrganizationById(organizationId);

  if (!organization || organization.status !== "active") {
    throw createError("Organization not found or inactive", 404);
  }

  // Invited users can receive organization invitation notifications.
  const recipientMembership =
    await membershipRepository.findMembership(
      recipientId,
      organizationId
    );

  if (
    !recipientMembership ||
    !["active", "invited"].includes(recipientMembership.status)
  ) {
    throw createError("Notification recipient is not eligible", 400);
  }

  return await notificationRepository.createNotification({
    ...notificationData,
    actorId
  });
};

// Get paginated notifications
const getMyNotifications = async (
  userId,
  organizationId,
  page = 1,
  limit = 20,
  isRead
) => {
  await getNotificationContext(userId, organizationId);

  page = Number(page);
  limit = Number(limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw createError("Invalid pagination parameters", 400);
  }

  if (
    isRead !== undefined &&
    isRead !== "true" &&
    isRead !== "false"
  ) {
    throw createError("isRead must be true or false", 400);
  }

  const filters = {
    skip: (page - 1) * limit,
    limit
  };

  if (isRead !== undefined) {
    filters.isRead = isRead === "true";
  }

  const [notifications, totalNotifications, unreadCount] =
    await Promise.all([
      notificationRepository.findNotificationsByRecipient(
        userId,
        organizationId,
        filters
      ),
      notificationRepository.countNotificationsByRecipient(
        userId,
        organizationId,
        filters
      ),
      notificationRepository.countUnreadNotifications(
        userId,
        organizationId
      )
    ]);

  return {
    notifications,
    pagination: {
      currentPage: page,
      limit,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit)
    },
    unreadCount
  };
};

// Get unread notification count
const getUnreadNotificationCount = async (userId, organizationId) => {
  await getNotificationContext(userId, organizationId);

  return await notificationRepository.countUnreadNotifications(
    userId,
    organizationId
  );
};

// Mark one notification as read
const markNotificationAsRead = async (
  userId,
  organizationId,
  notificationId
) => {
  validateIds({ organizationId, notificationId });

  await getNotificationContext(userId, organizationId);

  const notification =
    await notificationRepository.markNotificationAsRead(
      notificationId,
      userId,
      organizationId
    );

  if (!notification) {
    throw createError("Notification not found", 404);
  }

  return notification;
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (
  userId,
  organizationId
) => {
  await getNotificationContext(userId, organizationId);

  return await notificationRepository.markAllNotificationsAsRead(
    userId,
    organizationId
  );
};

// Delete one notification
const deleteMyNotification = async (
  userId,
  organizationId,
  notificationId
) => {
  validateIds({ organizationId, notificationId });

  await getNotificationContext(userId, organizationId);

  const notification =
    await notificationRepository.deleteNotification(
      notificationId,
      userId,
      organizationId
    );

  if (!notification) {
    throw createError("Notification not found", 404);
  }

  return notification;
};

// Delete all notifications
const deleteAllMyNotifications = async (userId, organizationId) => {
  await getNotificationContext(userId, organizationId);

  return await notificationRepository.deleteAllNotifications(
    userId,
    organizationId
  );
};

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteMyNotification,
  deleteAllMyNotifications
};
