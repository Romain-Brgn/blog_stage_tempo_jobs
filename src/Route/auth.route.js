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
/**REGISTER */
router.get("/register", (req, res) => {
  const flash =
    req.query && req.query.msg
      ? { type: req.query.type || "info", message: req.query.msg }
      : null;

  res.render("Auth/register", { title: "Créer un compte", flash: flash });
});

router.post(
  "/register",
  emailValidator,
  registerValidators,
  AuthController.register
);
/**CONFIRM */
router.get("/confirm", (req, res) => {
  const token = req.query?.token || "";
  res.render("Auth/confirm", {
    title: "Confirmation du compte",
    token,
    flash: null,
  });
});

router.post("/confirm", tokenValidator, AuthController.confirm);
/**RESEND CONFIRMATION */
router.post(
  "/resend-confirmation",
  emailValidator,
  AuthController.resendConfirmation
);
/**LOGIN */
router.post("/login", loginLimiter, loginValidator, AuthController.login);
router.get("/login", (req, res) => {
  const flash = req.query?.msg
    ? { type: req.query.type || "info", message: req.query.msg }
    : null;

  res.render("Auth/login", { title: "Connexion", flash });
});

/**REFRESH */
router.post("/refresh", AuthController.refresh);
/**ME */
router.get("/me", authenticateJWT, (req, res) => {
  return res.status(200).json({ user: req.user });
});
/**LOGOUT */
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
