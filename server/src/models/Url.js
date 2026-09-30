const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalUrl: { type: String, required: true, trim: true },
    // Unique index: redirect lookup by code + collision protection.
    // A custom alias is stored here too, so /:shortCode is one lookup.
    shortCode: { type: String, required: true, unique: true },
    // Set only when the user chose the code; marks it as custom.
    customAlias: { type: String, default: null },
    clickCount: { type: Number, default: 0 },
    lastClickedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Dashboard query: "my URLs, newest first" -> filter by user + sort by date
urlSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Url", urlSchema);
