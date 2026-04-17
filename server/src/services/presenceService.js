const User = require('../models/User');
const userManager = require('../sockets/userManager');

function normalizeUserRecord(user) {
  if (!user) {
    return null;
  }

  if (typeof user.toObject === 'function') {
    return user.toObject();
  }

  return { ...user };
}

function withUserPresence(user) {
  const normalizedUser = normalizeUserRecord(user);

  if (!normalizedUser) {
    return null;
  }

  const userId =
    normalizedUser._id?.toString?.() ||
    normalizedUser.id?.toString?.() ||
    '';

  return {
    ...normalizedUser,
    isOnline: userId ? userManager.isOnline(userId) : false,
  };
}

function withUsersPresence(users) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users.map((user) => withUserPresence(user));
}

async function updateUserLastSeen(userId, lastSeen = new Date()) {
  if (!userId) {
    return lastSeen;
  }

  await User.findByIdAndUpdate(userId, { lastSeen });
  return lastSeen;
}

module.exports = {
  updateUserLastSeen,
  withUserPresence,
  withUsersPresence,
};
