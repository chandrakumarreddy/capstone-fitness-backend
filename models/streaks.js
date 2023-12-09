const mongoose = require("mongoose");

const StreakSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  current_streak: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
  streak_history: [
    {
      date: { type: Date, required: true },
      completed: { type: Boolean, required: true },
    },
  ],
});

module.exports = mongoose.model("Streak", StreakSchema);
