const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/* =========================
   GET ALL USERS (ADMIN ONLY)
========================= */
router.get("/", auth, admin, async (req, res) => {
  try {

    const users = await User.find().select("name email");

    res.json(users);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* =========================
   GET SINGLE USER (optional)
========================= */
router.get("/:id", auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

module.exports = router;