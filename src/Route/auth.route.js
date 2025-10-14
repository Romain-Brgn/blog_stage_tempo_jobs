const express = require("express");
const router = express.Router();
const {
  emailValidator,
  registerValidators,
  tokenValidator,
  loginValidator,
} = require("../Validator/auth.validators");

const AuthController = require("../Controller/auth.controller");

router.post(
  "/register",
  emailValidator,
  registerValidators,
  AuthController.register
);
router.post("/confirm", tokenValidator, AuthController.confirm);

router.post(
  "/resend-confirmation",
  emailValidator,
  AuthController.resendConfirmation
);

router.post("/login", loginValidator, AuthController.login);

module.exports = router;
