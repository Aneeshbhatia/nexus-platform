const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET || "super_secret_jwt_key_for_nexus_ems_enterprise_2026",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

module.exports = generateToken;
