const express = require("express");
const router = express.Router();
const {
  registerValidators,
  tokenValidator,
} = require("../Validator/auth.validators");
const AuthController = require("../Controller/auth.controller");

router.post("/register", registerValidators, AuthController.register);
router.post("/confirm", tokenValidator, AuthController.confirm);
router.post("/resend-confirmation", AuthController.resendConfirmation);

module.exports = router;
