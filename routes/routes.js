const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const verifyJWT = require("../lib/verify-jwt");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("working");
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const user = new User({
    email,
    password: await bcrypt.hash(password, 10),
  });

  await user.save();

  const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token });
});

// Get a user profile
router.get("/profile", verifyJWT, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    dateOfBirth: user.dateOfBirth || "",
    profilePicture: user.profilePicture || "",
  });
});

// Update a user profile
router.post("/profile", verifyJWT, async (req, res) => {
  const user = await User.findById(req.user.id);

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.dateOfBirth = req.body.dateOfBirth;
  user.profilePicture = req.body.profilePicture;

  await user.save();

  res.json({ message: "Profile updated successfully" });
});

router.get("/protected", verifyJWT, (req, res) => {
  res.json({ message: "Hello, world!" });
});

module.exports = router;
