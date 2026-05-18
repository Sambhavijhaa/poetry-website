const User = require("../models/User");

module.exports = (req, res, next) => {
  if (req.user.email === "sambhavi.jha10@gmail.com") {
    return next();
  }
  return res.status(403).json({ message: "Admin only" });
};