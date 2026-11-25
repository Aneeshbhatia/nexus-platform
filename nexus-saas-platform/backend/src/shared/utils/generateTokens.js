
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (userId) => {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
    }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken
};
