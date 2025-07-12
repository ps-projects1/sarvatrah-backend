const route = require("express").Router();
const {
  addVehicle,
  deleteVehicle,
  updateVehicle,
  getVehicle,
} = require("../../src/controllers/Vehicle/vehicle.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Vehicle routes
route.get("/get-vehicles", getVehicle);
route.put("/update-vehicle/:id", authMiddleware, updateVehicle);
route.delete("/delete-vehicle/:id", authMiddleware, deleteVehicle);
route.post("/add-vehicle", authMiddleware, addVehicle);

module.exports = route;
