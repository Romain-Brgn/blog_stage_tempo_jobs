const { body, validationResult } = require("express-validator");
const C = require("../Config/constraints");

const registerValidators = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email requis")
    .bail()
    .isEmail()
    .withMessage("Email invalide")
    .bail()
    .isLength({ max: C.email.max })
    .withMessage(`Email max ${C.email.max} caractères`)
    .bail()
    .normalizeEmail({
      // explicite la normalisation
      all_lowercase: true, // baisse tout (local + domaine) => cohérent pour l’unicité
      gmail_remove_dots: false, // évite les surprises “janedoe” == “jane.doe”
      gmail_remove_subaddress: false,
    }),

  body("pseudonyme")
    .trim()
    .isLength({ min: C.pseudonyme.min, max: C.pseudonyme.max })
    .withMessage(
      `Pseudonyme ${C.pseudonyme.min}-${C.pseudonyme.max} caractères`
    )
    .bail()
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Caractères autorisés: lettres, chiffres, _ . -"),

  body("password")
    .isLength({ min: C.password.min })
    .withMessage(`Mot de passe min ${C.password.min} caractères`),

  body("status")
    .isIn(C.statusAllowed)
    .withMessage(`status doit être: ${C.statusAllowed.join(" ; ")}`),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];

const tokenValidator = [
  body("token")
    .trim()
    .bail()
    .isString()
    .withMessage("Token invalide")
    .notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { registerValidators, tokenValidator };
