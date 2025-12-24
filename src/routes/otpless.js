const express = require("express");
const router = express.Router();
const { otplessLogin } = require("../controllers/otpless/otpless.controller");

router.post("/otpless", otplessLogin);

module.exports = router;
