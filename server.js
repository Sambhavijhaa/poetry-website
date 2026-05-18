require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth");
const admin = require("./middleware/admin");

// 🔐 Protected admin page route
app.get("/admin", auth, admin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

const session = require("express-session");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// models
const User = require("./models/User");

// routes
const userRoutes = require("./routes/users");
const poemRoutes = require("./routes/poems");


/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "public"), {
  index: false
}));

/* =========================
   SESSION SETUP
========================= */

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

/* =========================
   PASSPORT INIT
========================= */

app.use(passport.initialize());
app.use(passport.session());

/* =========================
   GOOGLE STRATEGY
========================= */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/* =========================
   SERIALIZE / DESERIALIZE
========================= */

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/* =========================
   AUTH ROUTES
========================= */

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login.html",
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";

    res.redirect(`${FRONTEND_URL}/poems.html?token=${token}`);

  }
);

/* =========================
   API ROUTES
========================= */

// IMPORTANT: use ONE style only
app.use("/api/users", userRoutes);
app.use("/api/poems", poemRoutes);

/* =========================
   DEFAULT ROUTE
========================= */

app.get("/", (req, res) => {
  res.redirect("/poems.html");
});


/* =========================
   DATABASE + SERVER
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT;

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });