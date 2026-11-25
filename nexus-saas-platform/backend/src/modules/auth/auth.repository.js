
const User = require("./auth.model");

// Create a new user
const createUser = async (userData) => {
  return User.create(userData);
};

// Find user by email (password excluded by schema)
const findUserByEmail = async (email) => {
  return User.findOne({ email });
};

// Find user by email and explicitly include password
const findUserByEmailWithPassword = async (email) => {
  return User.findOne({ email }).select("+password");
};

// Find user by ID
const findUserById = async (userId) => {
  return User.findById(userId);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById
};
