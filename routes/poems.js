const express = require("express");
const router = express.Router();

const Poem = require("../models/Poem");
const User = require("../models/User"); // ✅ FIXED
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/* =======================
   GET ALL POEMS
======================= */
router.get("/", async (req, res) => {
  try {
    const poems = await Poem.find()
      .sort({ createdAt: -1 })
      .populate("comments.user", "name email")
      .populate("likes", "name email");

    res.json(poems);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch poems" });
  }
});

/* =======================
   CREATE POEM
======================= */
router.post("/", auth, admin, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content required" });
    }

    // ✅ FIXED: fetch user properly
    const user = await User.findById(req.user.id);

    const newPoem = new Poem({
      title: title.trim(),
      content: content.trim(),
      author: user?.name || "unsaid.by_heart"
    });

    await newPoem.save();
    res.status(201).json(newPoem);

  } catch (err) {
    res.status(500).json({ message: "Failed to create poem" });
  }
});

/* =======================
   LIKE / UNLIKE
======================= */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);

    if (!poem) {
      return res.status(404).json({ message: "Poem not found" });
    }

    const userId = req.user.id;

    const alreadyLiked = poem.likes.some(
      (id) => String(id) === String(userId)
    );

    if (alreadyLiked) {
      poem.likes = poem.likes.filter(
        (id) => String(id) !== String(userId)
      );
    } else {
      poem.likes.push(userId);
    }

    await poem.save();

    res.json({
      likes: poem.likes.length,
      liked: !alreadyLiked
    });

  } catch (err) {
    res.status(500).json({ message: "Server error while liking" });
  }
});

/* =======================
   ADD COMMENT
======================= */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);

    if (!poem) {
      return res.status(404).json({ message: "Poem not found" });
    }

    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    poem.comments.push({
      user: req.user.id,
      text
    });

    await poem.save();

    const updatedPoem = await Poem.findById(req.params.id)
      .populate("comments.user", "name email")
      .populate("likes", "name email");

    res.json(updatedPoem);

  } catch (err) {
    res.status(500).json({ message: "Server error while commenting" });
  }
});

/* =======================
   UPDATE POEM
======================= */
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { title, content } = req.body;

    const updated = await Poem.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Poem not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Failed to update poem" });
  }
});

/* =======================
   DELETE POEM
======================= */
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const deleted = await Poem.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Poem not found" });
    }

    res.json({ message: "Poem deleted" });

  } catch (err) {
    res.status(500).json({ message: "Failed to delete poem" });
  }
});

/* =======================
   DELETE COMMENT
======================= */
router.delete("/:poemId/comment/:commentId", auth, admin, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.poemId);

    if (!poem) {
      return res.status(404).json({ message: "Poem not found" });
    }

    poem.comments = poem.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );

    await poem.save();

    res.json({ message: "Comment deleted" });

  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

module.exports = router;