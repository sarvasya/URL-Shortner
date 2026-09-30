const express = require("express");
const c = require("../controllers/urlController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // every route below requires a valid JWT

router.post("/", c.createUrl);
router.get("/", c.listUrls);
router.get("/:id/analytics", c.getAnalytics);
router.get("/:id", c.getUrl);
router.patch("/:id", c.updateUrl);
router.delete("/:id", c.deleteUrl);

module.exports = router;
