const express = require("express");
const router = express.Router();
const {
  emailValidator,
  registerValidators,
  tokenValidator,
  loginValidator,
} = require("../Validator/auth.validators");
const AuthController = require("../Controller/auth.controller");
const UserRepository = require("../Repository/UserRepository");
const { authenticateJWT } = require("../Middleware/auth.middleware");
const { loginLimiter } = require("../Middleware/rate-limiter.middleware");
const crypto = require("crypto");

//=========================================================================//
/** MES ROUTES QUI CONCERNENT L'AUTHENTIFICATION et qui viennent de /Auth */
//=========================================================================//
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

router.post("/refresh", AuthController.refresh);

router.get("/me", authenticateJWT, (req, res) => {
  return res.status(200).json({ user: req.user });
});

router.post("/logout", async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (typeof refresh_token !== "string" || refresh_token.trim() === "") {
      return res.status(400).json({ message: "Refresh token manquant." });
    }

    const hash = crypto
      .createHash("sha256")
      .update(refresh_token)
      .digest("hex");
    await UserRepository.revokeRefreshToken(hash);
    res.clearCookie("refresh_token", { path: "/auth" });
    return res.status(200).json({ message: "Déconnecté" });
  } catch (e) {
    // on garde une réponse neutre
    return res.status(200).json({ message: "Déconnecté" });
  }
});

module.exports = router;
