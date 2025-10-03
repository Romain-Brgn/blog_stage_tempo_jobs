const express = require("express");
const router = express.Router();
const adminController = require("../Controller/admin.controller");

router.get("/signin", adminController.formSignIn);
router.get("/signin", adminController.formSignIn);

module.exports = router;
