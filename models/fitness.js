const mongoose = require("mongoose");

// const fitnessSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   tips: {
//     type: Array,
//     required: true,
//     items: {
//       short_description: String,
//       long_description: String,
//     },
//   },
//   type: { type: String, required: true, enum: ["fitness", "nutrition"] },
// });

const commentsSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const tipsSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    comments: [commentsSchema],
  },
  {
    timestamps: true,
  }
);

const fitnessSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    tips: [tipsSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Fitness", fitnessSchema);
