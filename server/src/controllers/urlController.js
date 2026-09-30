const urlService = require("../services/urlService");

// Shape of a URL in API responses
const toDto = (url) => ({
  id: url._id,
  originalUrl: url.originalUrl,
  shortCode: url.shortCode,
  shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
  customAlias: url.customAlias,
  clickCount: url.clickCount,
  lastClickedAt: url.lastClickedAt,
  expiresAt: url.expiresAt,
  isActive: url.isActive,
  createdAt: url.createdAt,
});

const createUrl = async (req, res, next) => {
  try {
    const url = await urlService.createShortUrl({ userId: req.user._id, ...req.body });
    res.status(201).json({ success: true, data: toDto(url) });
  } catch (err) {
    next(err);
  }
};

const listUrls = async (req, res, next) => {
  try {
    const { urls, ...pagination } = await urlService.listUrls(
      req.user._id, req.query.page, req.query.limit
    );
    res.json({ success: true, data: urls.map(toDto), ...pagination });
  } catch (err) {
    next(err);
  }
};

const getUrl = async (req, res, next) => {
  try {
    const url = await urlService.getOwnedUrl(req.params.id, req.user._id);
    res.json({ success: true, data: toDto(url) });
  } catch (err) {
    next(err);
  }
};

const updateUrl = async (req, res, next) => {
  try {
    const url = await urlService.updateUrl(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: toDto(url) });
  } catch (err) {
    next(err);
  }
};

const deleteUrl = async (req, res, next) => {
  try {
    await urlService.deleteUrl(req.params.id, req.user._id);
    res.json({ success: true, message: "URL deleted" });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const url = await urlService.getOwnedUrl(req.params.id, req.user._id);
    res.json({
      success: true,
      data: {
        ...toDto(url),
        totalClicks: url.clickCount,
        createdDate: url.createdAt,
        lastClicked: url.lastClickedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const redirectToOriginal = async (req, res, next) => {
  try {
    const originalUrl = await urlService.resolveShortCode(req.params.shortCode);
    // 302 (temporary): browsers don't cache it, so every click is counted
    res.redirect(302, originalUrl);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUrl, listUrls, getUrl, updateUrl, deleteUrl, getAnalytics, redirectToOriginal,
};
