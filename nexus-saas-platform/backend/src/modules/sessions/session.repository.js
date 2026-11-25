
const Session = require("./session.model");

// Create a new session
const createSession = async (sessionData) => {
  return Session.create(sessionData);
};

// Find an active session by refresh-token hash
const findActiveSession = async (tokenHash) => {
  return Session.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
};

// Atomically revoke an active session during rotation
const rotateSession = async (userId, tokenHash) => {
  return Session.findOneAndUpdate(
    {
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    },
    {
      $set: {
        revokedAt: new Date()
      }
    },
    {
      new: false
    }
  );
};

// Revoke a session during logout
const revokeSessionByTokenHash = async (tokenHash) => {
  return Session.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    },
    {
      new: true
    }
  );
};

module.exports = {
  createSession,
  findActiveSession,
  rotateSession,
  revokeSessionByTokenHash
};
