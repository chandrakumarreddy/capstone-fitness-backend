const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  type: {
    type: String,
  },
});

const TrainerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slots: [SlotSchema],
});

module.exports = mongoose.model("Trainer", TrainerSchema);
