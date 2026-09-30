const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode === 500) console.error(err);
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : err.message,
  });
};

module.exports = { notFound, errorHandler };
