const express = require("express");
const router = express.Router();
const { registerValidators } = require("../Validator/auth.validators");
const AuthController = require("../Controller/auth.controller");

router.post("/register", registerValidators, AuthController.register);

module.exports = router;
