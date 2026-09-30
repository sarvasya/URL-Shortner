const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

// Expects header:  Authorization: Bearer <token>
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) throw new AppError("Not authenticated", 401);

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await User.findById(payload.id);
    if (!user) throw new AppError("User no longer exists", 401);

    req.user = user; // available to all later handlers
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
