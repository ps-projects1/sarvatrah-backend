const route = require("express").Router();
const { getState } = require("../controllers/State/state.controller");
const { generalLimiter } = require("../middlewares/rateLimit");

// Apply generalLimiter to prevent abuse
route.get("/get-state", generalLimiter, getState);

module.exports = route;
