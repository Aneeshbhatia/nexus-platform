const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("Authorization header received:", Boolean(authHeader));

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing"
      });
    }

    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      console.error("JWT_ACCESS_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error"
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload"
      });
    }

    req.auth = {
      userId: decoded.sub
    };

    next();

  } catch (error) {
    console.error("JWT verification failed:", error.name, error.message);

    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError"
        ? "Access token has expired"
        : "Invalid access token"
    });
  }
};

module.exports = { authenticate };