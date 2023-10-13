const express = require("express");
const Model = require("../models/user");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("working");
});

module.exports = router;
