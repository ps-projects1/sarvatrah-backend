const route = require("express").Router();
const { getCity, addCity } = require("../controllers/City/city.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to get all cities
route.get("/get-city", getCity);
route.get("/add-city", authMiddleware, addCity);

module.exports = route;
