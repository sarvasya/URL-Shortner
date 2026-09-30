const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const register = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new AppError("name, email and password are required", 400);
  }
  if (!EMAIL_REGEX.test(email)) throw new AppError("Invalid email", 400);
  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10); // 10 salt rounds
  const user = await User.create({ name, email, passwordHash });
  return { token: signToken(user._id), user: publicUser(user) };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new AppError("email and password are required", 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  // Same message for both cases so attackers can't discover which emails exist
  if (!ok) throw new AppError("Invalid email or password", 401);

  return { token: signToken(user._id), user: publicUser(user) };
};

module.exports = { register, login, publicUser };
