const route = require("express").Router();
const {
  addVehicle,
  deleteVehicle,
  updateVehicle,
  getVehicle,
} = require("../../src/controllers/Vehicle/vehicle.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const { generalLimiter } = require("../middlewares/rateLimit");

// Vehicle routes with generalLimiter
route.get("/get-vehicles", generalLimiter, getVehicle);
route.put("/update-vehicle/:id", authMiddleware, generalLimiter, updateVehicle);
route.delete("/delete-vehicle/:id", authMiddleware, generalLimiter, deleteVehicle);
route.post("/add-vehicle", authMiddleware, generalLimiter, addVehicle);

module.exports = route;
