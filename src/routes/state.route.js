const route = require("express").Router();
const { getState } = require("../controllers/State/state.controller");

// Route to get all states
route.get("/get-state", getState);

module.exports = route;
