const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  dateOfBirth: { type: String },
  profilePicture: { type: String },
});

module.exports = mongoose.model("User", userSchema);
