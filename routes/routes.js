const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Fitness = require("../models/fitness");
const Trainers = require("../models/trainers");
const Streak = require("../models/streaks");
const FitnessVideos = require("../models/fitnessVideos");
const bcrypt = require("bcrypt");
const verifyJWT = require("../lib/verify-jwt");
const router = express.Router();
const axios = require("axios");
const dayjs = require("dayjs");

async function createStreak(userId) {
  const newStreak = new Streak({
    user_id: userId,
  });
  await newStreak.save();
}

async function updateStreak(userId, completed = true) {
  const streak = await Streak.findOne({ user_id: userId });
  if (streak) {
    const isStreakCompletedForToday = streak.streak_history.find(
      (item) =>
        dayjs(item.date).format("DD/MM/YYYY") === dayjs().format("DD/MM/YYYY")
    );
    if (isStreakCompletedForToday) return;
    streak.last_updated = Date.now();
    if (completed) {
      streak.current_streak++;
      streak.longest_streak = Math.max(
        streak.current_streak,
        streak.longest_streak
      );
      streak.streak_history.push({ date: Date.now(), completed: true });
    } else {
      streak.current_streak = 0;
      streak.streak_history.push({ date: Date.now(), completed: false });
    }
    await streak.save();
  }
}

router.get("/", (res) => {
  res.send("working");
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user?._id) {
    return res.status(400).json({ message: "email already exists" });
  }

  const newUser = new User({
    email,
    password: await bcrypt.hash(password, 10),
  });

  await newUser.save();

  await createStreak(newUser._id);

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

  res.json({ message: "success", token });
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

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
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
    // user.dateOfBirth = req.body.dateOfBirth;
    // user.profilePicture = req.body.profilePicture;

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
  const type = req.query.type;
  let result;
  if (type === "videos") {
    result = await FitnessVideos.find();
  } else {
    result = await Fitness.find();
  }

  res.json({ results: result, message: "success" });
});

router.get("/fitness/:fitnessId", verifyJWT, async (req, res) => {
  const fitnessTip = await Fitness.findById(req.params.fitnessId);

  res.json({ result: fitnessTip, message: "success" });
});

router.post("/fitness", verifyJWT, async (req, res) => {
  const type = req.query.type;
  try {
    let result, fitnessTips;
    if (type === "videos") {
      fitnessTips = new FitnessVideos({
        title: req.body.title,
        link: req.body.link,
      });
    } else {
      fitnessTips = new Fitness({
        title: req.body.title,
      });
    }
    result = await fitnessTips.save();

    res.json({
      result: { title: result.title },
      message: "success",
    });
  } catch (error) {
    res.status(400).json({
      results: error.message,
      message: "failure",
    });
  }
});

router.post("/fitness/:fitnessId/tips", async (req, res) => {
  try {
    const { text } = req.body;
    const fitnessId = req.params.fitnessId;
    const fitness = await Fitness.findById(fitnessId);
    if (!fitness) {
      return res.status(404).json({ error: "Fitness tip not found" });
    }
    fitness.tips.push({ text });
    await fitness.save();
    res.json({ message: "success", result: { text } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/streaks", verifyJWT, async (req, res) => {
  let streaks = await Streak.findOne({ user_id: req.user.id });
  if (!streaks) {
    streaks = await createStreak(req.user.id);
  }
  res.status(200).json({ message: "Streak completed", result: streaks });
});

router.post("/streaks", verifyJWT, async (req, res) => {
  await updateStreak(req.user.id);
  res.status(200).json({ message: "Streak completed" });
});

router.post("/fitness/:fitnessId/tips/:tipId/like", async (req, res) => {
  try {
    const fitnessId = req.params.fitnessId;
    const tipId = req.params.tipId;
    const { liked } = req.body;
    const fitness = await Fitness.findById(fitnessId);
    if (!fitness) {
      return res.status(404).json({ error: "Fitness not found" });
    }
    const tip = fitness.tips.id(tipId);
    if (!tip) {
      return res.status(404).json({ error: "Tip not found" });
    }
    if (liked) {
      tip.likes += 1;
    } else {
      tip.dislikes += 1;
    }
    await fitness.save();
    res.json(tip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/reset", verifyJWT, async (req, res) => {
  await Fitness.deleteMany();
  await User.deleteMany();
  res.json({ message: "success" });
});

router.get("/trainer/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;
  const trainer = await Trainers.findOne({ id });
  if (trainer) {
    res.json({ message: "success", result: { trainer } });
  } else {
    const newTrainer = new Trainers({
      id,
      slots: [],
    });
    await newTrainer.save();
    res.json({ message: "success", result: { trainer: newTrainer } });
    res.status(404).json({ error: "Trainer not found" });
  }
});

router.post("/trainer/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
  const trainer = await Trainers.findOne({ id });
  if (trainer) {
    trainer.slots.push(slot);
    await trainer.save();
    res.json({ message: "success", result: { trainer } });
  } else {
    const newTrainer = new Trainers({
      id,
      slots: [slot],
    });
    await newTrainer.save();
    res.json({ message: "success", result: { trainer: newTrainer } });
  }
});

router.get("/protected", verifyJWT, (req, res) => {
  res.json({ message: "Hello, world!" });
});

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      "https://api.ai21.com/studio/v1/j2-ultra/chat",
      {
        numResults: 1,
        temperature: 0.7,
        messages: [
          {
            text: message,
            role: "user",
          },
        ],
        system:
          "You are an AI assistant for Fitness and yoga training tips. Your responses should be informative and concise.",
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.AI21_KEY}`,
        },
      }
    );
    const json = await response.data;

    res.json({ message: json.outputs[0].text });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
