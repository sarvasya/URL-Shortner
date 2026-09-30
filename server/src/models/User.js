const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // unique: true -> unique index: fast login lookup + no duplicate accounts
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // select: false -> never returned by queries unless explicitly requested
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
