const express = require("express");
const { vehicleCollection, hotelCollection } = require("../models/inventries");

const route = express.Router();

route.get("/", (req, res, next) => {
  res.status(200).json({ status: "Process here" });
});

route.get("/details", async (req, res, next) => {
  const totalLength = 4;
  adult = req.query.adult || 0;
  child = req.query.child || 0;

  const totalCount = Number(adult);
  let getVehicle = await vehicleCollection.find({ seatLimit: adult });
  while (getVehicle.length < 1) {
    console.log(adult);
    getVehicle = await vehicleCollection.find({ seatLimit: adult });
    adult++;
  }
  if (getVehicle.length >= totalLength) {
    res.status(200).json(getVehicle[(0, 3)]);
  } else {
    res.status(200).json(getVehicle);
  }
});

module.exports = route;
