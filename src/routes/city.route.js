const route = require("express").Router();
const {
  getCity,
  addCity,
  updateCity,
  deleteCity,
} = require("../controllers/City/city.controller");

const authMiddleware = require("../middlewares/authMiddleware");

route.get("/get-city", getCity);
route.post("/add-city", authMiddleware, addCity);
route.put("/update-city", authMiddleware, updateCity);
route.delete("/delete-city", authMiddleware, deleteCity); // ⬅ ADDED

module.exports = route;
