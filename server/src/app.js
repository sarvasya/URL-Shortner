const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const { redirectToOriginal } = require("./controllers/urlController");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const limiter = (max, windowMinutes) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { success: false, message: "Too many requests, try again later" },
  });

// Stricter limit on auth to slow down password guessing
app.use("/api/auth", limiter(20, 15), authRoutes);
app.use("/api/urls", limiter(200, 15), urlRoutes);

// Must come AFTER /api routes, otherwise "/:shortCode" would swallow them
app.get("/:shortCode", redirectToOriginal);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
