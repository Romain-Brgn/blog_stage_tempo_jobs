const { body, validationResult } = require("express-validator");

const registerValidators = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("pseudonyme")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Pseudonyme 3-50 caractères")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Caractères autorisés: lettres, chiffres, _ . -"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Mot de passe min 8 caractères"),
  body("status")
    .isIn(["professionnel", "candidat", "curieux"])
    .withMessage("status doit être: professionnel | candidat | curieux"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];

module.exports = { registerValidators };
