const mongoose = require("mongoose");

const fitnessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tips: { type: Array, required: true, items: { type: String } },
  type: { type: String, required: true, enum: ["fitness", "nutrition"] },
});

module.exports = mongoose.model("Fitness", fitnessSchema);
