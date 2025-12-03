const route = require("express").Router();
const {
  getCity,
  addCity,
  updateCity,
  deleteCity,
} = require("../controllers/City/city.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const { generalLimiter } = require("../middlewares/rateLimit");

// Apply generalLimiter for all routes
route.get("/get-city", generalLimiter, getCity);
route.post("/add-city", authMiddleware, generalLimiter, addCity);
route.put("/update-city", authMiddleware, generalLimiter, updateCity);
route.delete("/delete-city", authMiddleware, generalLimiter, deleteCity); // ⬅ ADDED

module.exports = route;
