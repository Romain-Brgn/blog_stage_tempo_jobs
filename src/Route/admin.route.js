const express = require("express");
const router = express.Router();
const adminController = require("../Controller/admin.controller");
const {
  authenticateJWT,
  requireAdmin,
} = require("../Middleware/auth.middleware");

router.get("/ping", authenticateJWT, requireAdmin, (req, res) => {
  res.json({ ok: true });
});

router.get("/signin", adminController.formSignIn); // fais avec karim a voir si on garde par la suite
router.get("/signin", adminController.formSignIn); // fais avec karim a voir si on garde par la suite

module.exports = router;
