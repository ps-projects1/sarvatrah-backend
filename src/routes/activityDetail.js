const express = require("express");
const router = express.Router();
const { getActivityById } = require("../controllers/activity/activity.js");

router.get("/activity/:id", getActivityById);

module.exports = router;
