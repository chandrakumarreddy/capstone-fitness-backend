const mongoose = require("mongoose");

const TrainerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slots: [String],
});

module.exports = mongoose.model("Trainer", TrainerSchema);
