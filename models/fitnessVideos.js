const mongoose = require("mongoose");

const fitnessLinksSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    link: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FitnessLinks", fitnessLinksSchema);
