const express = require("express");
const router = express.Router();
const {
  emailValidator,
  registerValidators,
  tokenValidator,
  loginValidator,
} = require("../Validator/auth.validators");

const AuthController = require("../Controller/auth.controller");
const { authenticateJWT } = require("../Middleware/auth.middleware");
const { loginLimiter } = require("../Middleware/rate-limiter.middleware");

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

router.post("/login", loginLimiter, loginValidator, AuthController.login);

router.get("/me", authenticateJWT, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;
