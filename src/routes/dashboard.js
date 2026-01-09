const route = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminOnlyMiddleware = require("../middlewares/adminOnlyMiddleware");

const {
  getDashboardStats
} = require("../controllers/Dashboard/dashboard.controller");

route.get("/stats", authMiddleware, adminOnlyMiddleware, getDashboardStats);

module.exports = route;
