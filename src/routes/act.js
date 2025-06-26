const express = require("express");
const route = express.Router();
const upload = require("../utils/file_upload/upload");
const activityModel = require("../models/activities");
const { vehicleCollection, hotelCollection } = require("../models/inventries");

route.get("/", async (req, res, next) => {
  const id = req.query.id;
  const type = req.query.type;
  console.log(id, type);
  if (type === "hotel") {
    const hotelActivities = await hotelCollection.findById(id);
    if (!hotelActivities) {
      return res.status(404).json({ error: "Package not found" });
    }
    const response = hotelActivities;
    res.status(200).json(response);
  }
  if (type === "activity") {
    const activities = await activityModel.findById(id);
    if (!activities) {
      return res.status(404).json({ error: "Package not found" });
    }
    const response = activities;
    res.status(200).json(response);
  }
  if (type === "car") {
    const vehicleActivities = await vehicleCollection.findById(id);
    if (!vehicleActivities) {
      return res.status(404).json({ error: "Package not found" });
    }
    const response = vehicleActivities;
    res.status(200).json(response);
  }
});

route.get("/lists", async (req, res, next) => {
  const person = req.query.counts;
});
route.post("/", upload.single("file"), async (req, res, next) => {
  const packageType = req.query.packageType;
  const activityName = req.query.activityName;
  const activityPlace = req.query.activityPlace;
  const targetPlaces = JSON.parse(req.query.targetPlaces);
  const duration = req.query.duration;
  const placeCover = req.query.placeCover;
  const price = req.query.price;
  const description = req.query.description;
  const img = {
    filename: req.file.filename,
    path: "http://127.0.0.1:3232/" + req.file.path.replace("public/", ""),
    mimetype: req.file.mimetype,
  };
  await activityModel.create({
    packageType: packageType,
    activityName: activityName,
    activityPlace: activityPlace,
    targetPlaces: targetPlaces,
    duration: duration,
    placeCover: placeCover,
    price: price,
    description: description,
    img: img,
  });
  res.status(200).json({ message: "activity created" });
});

module.exports = route;
