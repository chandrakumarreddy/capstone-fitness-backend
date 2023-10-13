const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Fitness = require("../models/fitness");
const bcrypt = require("bcrypt");
const verifyJWT = require("../lib/verify-jwt");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("working");
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user._id) {
    return res.status(400).json({ message: "email already exists" });
  }

  const newUser = new User({
    email,
    password: await bcrypt.hash(password, 10),
  });

  await newUser.save();

  const token = await jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

  res.json({ message: "success" });
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

  res.json({ token, message: "success" });
});

// Get a user profile
router.get("/profile", verifyJWT, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    user: {
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      dateOfBirth: user.dateOfBirth || "",
      profilePicture: user.profilePicture || "",
    },
    message: "success",
  });
});

// Update a user profile
router.post("/profile", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.dateOfBirth = req.body.dateOfBirth;
    user.profilePicture = req.body.profilePicture;

    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(400).json({
      results: error.message,
      message: "failure",
    });
  }
});

router.get("/fitness", verifyJWT, async (req, res) => {
  const fitnessTips = await Fitness.find();

  res.json({ results: fitnessTips, message: "success" });
});

router.post("/fitness", verifyJWT, async (req, res) => {
  try {
    const fitnessTips = new Fitness({
      name: req.body.name,
      tips: req.body.tips,
      type: req.body.type,
    });

    const result = await fitnessTips.save();

    res.json({
      results: { name: result.name, tips: result.tips },
      message: "success",
    });
  } catch (error) {
    res.status(400).json({
      results: error.message,
      message: "failure",
    });
  }
});

router.get("/reset", verifyJWT, async (req, res) => {
  await Fitness.deleteMany();
  await User.deleteMany();
  res.json({ message: "success" });
});

router.get("/protected", verifyJWT, (req, res) => {
  res.json({ message: "Hello, world!" });
});

module.exports = router;
