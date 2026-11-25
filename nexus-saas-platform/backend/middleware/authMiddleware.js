const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no authentication token provided",
    });
  }

  try {
    const secret =
      process.env.JWT_SECRET ||
      "super_secret_jwt_key_for_nexus_ems_enterprise_2026";
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("employeeId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user no longer exists",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive or suspended",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Token has expired, please log in again"
          : "Not authorized, token invalid",
    });
  }
};

module.exports = { protect };
