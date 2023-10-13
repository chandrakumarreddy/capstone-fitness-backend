const jwt = require("jsonwebtoken");

async function verifyJWT(req, res, next) {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  token = token.replace("Bearer ", "");

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = verifyJWT;
