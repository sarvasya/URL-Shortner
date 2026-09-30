require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy .env.example to .env");
  process.exit(1);
}

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server on port ${PORT}`)))
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
