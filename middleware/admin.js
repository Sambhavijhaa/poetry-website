const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Admin only" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Admin check failed" });
  }
};