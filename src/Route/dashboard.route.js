const express = require("express");
const router = express.Router();
const UserRepository = require("../Repository/UserRepository");
const { authenticateJWT } = require("../Middleware/auth.middleware");

module.exports = router;
