
const bcrypt = require("bcrypt");

const authRepository = require("./auth.repository");
const sessionRepository = require("../sessions/session.repository");

const {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken
} = require("../../shared/utils/generateTokens");

// Create application errors
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Calculate refresh-token expiration
const getRefreshTokenExpiry = () => {
  const days = Number(
    process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7
  );

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("Invalid refresh-token expiration configuration");
  }

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

// Register user
const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw createError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await authRepository.createUser({
    name,
    email,
    password: hashedPassword
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    createdAt: user.createdAt
  };
};

// Login user
const loginUser = async ({ email, password }) => {
  const user = await authRepository.findUserByEmailWithPassword(email);

  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  if (user.status !== "active") {
    throw createError("Account is unavailable", 403);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw createError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();

  await sessionRepository.createSession({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiry()
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      status: user.status
    },
    accessToken,
    refreshToken
  };
};

// Get current user
const getCurrentUser = async (userId) => {
  const user = await authRepository.findUserById(userId);

  if (!user || user.status !== "active") {
    throw createError("User account is unavailable", 401);
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    createdAt: user.createdAt
  };
};

// Refresh access token and rotate refresh token
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw createError("Refresh token is required", 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);

  // Find the existing active session
  const activeSession = await sessionRepository.findActiveSession(
    tokenHash
  );

  if (!activeSession) {
    throw createError("Invalid or expired refresh token", 401);
  }

  // Atomically revoke the old session
  const revokedSession = await sessionRepository.rotateSession(
    activeSession.userId,
    tokenHash
  );

  if (!revokedSession) {
    throw createError("Refresh token has already been used", 401);
  }

  const user = await authRepository.findUserById(
    revokedSession.userId
  );

  if (!user || user.status !== "active") {
    throw createError("User account is unavailable", 401);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken();

  // Store only the new refresh-token hash
  await sessionRepository.createSession({
    userId: user._id,
    tokenHash: hashRefreshToken(newRefreshToken),
    expiresAt: getRefreshTokenExpiry()
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

// Logout user
const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await sessionRepository.revokeSessionByTokenHash(tokenHash);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser
};
