const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => {
  res.json({ success: true, data: { user: authService.publicUser(req.user) } });
};

module.exports = { register, login, me };
