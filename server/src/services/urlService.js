const mongoose = require("mongoose");
const Url = require("../models/Url");
const generateShortCode = require("../utils/generateShortCode");
const cache = require("../utils/cache");
const AppError = require("../utils/AppError");

const MAX_RETRIES = 5;
const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
// Words that would clash with app routes or confuse users
const RESERVED = ["api", "login", "register", "dashboard", "analytics", "admin", "health"];

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const parseFutureDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError("Invalid expiration date", 400);
  if (date <= new Date()) throw new AppError("Expiration must be in the future", 400);
  return date;
};

const createShortUrl = async ({ userId, originalUrl, customAlias, expiresAt }) => {
  if (!originalUrl) throw new AppError("originalUrl is required", 400);
  if (!isValidHttpUrl(originalUrl)) {
    throw new AppError("Invalid URL. Must start with http:// or https://", 400);
  }
  const expiry = expiresAt ? parseFutureDate(expiresAt) : null;

  if (customAlias) {
    if (!ALIAS_REGEX.test(customAlias)) {
      throw new AppError("Alias must be 3-30 characters: letters, numbers, - or _", 400);
    }
    if (RESERVED.includes(customAlias.toLowerCase())) {
      throw new AppError("This alias is reserved", 400);
    }
    try {
      return await Url.create({
        userId, originalUrl, customAlias, shortCode: customAlias, expiresAt: expiry,
      });
    } catch (err) {
      if (err.code === 11000) throw new AppError("Alias already taken", 409);
      throw err;
    }
  }

  // Random code: insert and let the unique index reject collisions, then retry
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await Url.create({
        userId, originalUrl, shortCode: generateShortCode(), expiresAt: expiry,
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  throw new AppError("Could not generate a unique short code", 500);
};

const listUrls = async (userId, page = 1, limit = 10) => {
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const [urls, total] = await Promise.all([
    Url.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Url.countDocuments({ userId }),
  ]);
  return { urls, page, total, totalPages: Math.ceil(total / limit) || 1 };
};

// Finds a URL and makes sure it belongs to the logged-in user
const getOwnedUrl = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid URL id", 400);
  const url = await Url.findById(id);
  if (!url) throw new AppError("URL not found", 404);
  if (String(url.userId) !== String(userId)) {
    throw new AppError("You do not have access to this URL", 403);
  }
  return url;
};

const updateUrl = async (id, userId, { isActive, expiresAt }) => {
  const url = await getOwnedUrl(id, userId);

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") throw new AppError("isActive must be true or false", 400);
    url.isActive = isActive;
  }
  if (expiresAt !== undefined) {
    url.expiresAt = expiresAt === null ? null : parseFutureDate(expiresAt);
  }

  await url.save();
  cache.del(url.shortCode); // cached copy is now stale
  return url;
};

const deleteUrl = async (id, userId) => {
  const url = await getOwnedUrl(id, userId);
  await url.deleteOne();
  cache.del(url.shortCode);
};

const resolveShortCode = async (shortCode) => {
  let entry = cache.get(shortCode);

  if (!entry) {
    const url = await Url.findOne({ shortCode }).select("originalUrl expiresAt isActive");
    if (!url) throw new AppError("URL not found", 404);
    entry = {
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
    };
    cache.set(shortCode, entry);
  }

  if (!entry.isActive) throw new AppError("This URL has been disabled", 403);
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    throw new AppError("This URL has expired", 410);
  }

  // Atomic increment: simultaneous clicks are never lost
  await Url.updateOne(
    { shortCode },
    { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } }
  );
  return entry.originalUrl;
};

module.exports = {
  createShortUrl, listUrls, getOwnedUrl, updateUrl, deleteUrl, resolveShortCode,
};
