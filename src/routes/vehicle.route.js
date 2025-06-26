const route = require("express").Router();
const {
  addVehicle,
  deleteVehicle,
  updateVehicle,
  getVehicle,
} = require("../../src/controllers/Vehicle/vehicle.controller");

// Vehicle routes
route.get("/get-vehicles", getVehicle);
route.put("/update-vehicle/:id", updateVehicle);
route.delete("/delete-vehicle/:id", deleteVehicle);
route.post("/add-vehicle", addVehicle);

module.exports = route;
