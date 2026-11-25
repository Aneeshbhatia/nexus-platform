
const authService = require("./auth.service");

const isProduction = process.env.NODE_ENV === "production";

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge:
    Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7) *
    24 * 60 * 60 * 1000
});

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth"
  });
};

// Register
const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user }
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(
      req.auth.userId
    );

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: { user }
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Refresh access token
const refresh = async (req, res) => {
  try {
    const result = await authService.refreshAccessToken(
      req.cookies?.refreshToken
    );

    // Replace the old refresh cookie with the rotated token
    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    clearRefreshCookie(res);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error"
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    await authService.logoutUser(req.cookies?.refreshToken);

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout
};
