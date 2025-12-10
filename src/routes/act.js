const express = require("express");
const route = express.Router();
const upload = require("../utils/file_upload/upload");
const activityModel = require("../models/activities");
const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");
const uploadToSupabase = require("../utils/uploadToSupabase");

route.get("/",generalLimiter, async (req, res, next) => {
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

route.get("/lists",generalLimiter, async (req, res, next) => {
  const person = req.query.counts;
});
route.post(
  "/",
  upload.fields([{ name: "file", maxCount: 1 }]),
  limitIfFiles(uploadLimiter),
  async (req, res, next) => {
    try {
      // Extracting data from query parameters
      const {
        packageName,
        packageDuration,
        availableVehicle,
        groupSize,
        include,
        exclude,
        startLocation,
        activityLocation,
        discount,
        price,
        overview,
        availableLanguage,
        cancellationPolicy,
        highlight,
        mapLink,
        unEligibility,
        availableSlot,
        pickUpAndDrop,
        pickUpOnly,
        dropOnly,
        pickUpLocation,
        dropLocation,
        ageTypes,
        age,
      } = req.query;

      // -----------------------------
      // 🔥 Upload File to Supabase
      // -----------------------------
      const fileObj = req.files.file?.[0];
      if (!fileObj) {
        return res.status(400).json({ error: "File is required" });
      }

      const supabaseUrl = await uploadToSupabase(
        fileObj.path,          // localFilePath
        fileObj.originalname,  // originalName
        "activities"           // folder name
      );

      const themeImg = {
        filename: fileObj.originalname,
        path: supabaseUrl,
        mimetype: fileObj.mimetype,
      };

      // -----------------------------
      // CREATE ACTIVITY
      // -----------------------------
      await activityCollection.create({
        packageName,
        packageDuration,
        themeImg,
        availableVehicle: JSON.parse(availableVehicle),
        groupSize,
        include: JSON.parse(include),
        exclude: JSON.parse(exclude),
        startLocation,
        activityLocation,
        discount,
        price,
        overview,
        availableLanguage: JSON.parse(availableLanguage),
        cancellationPolicy,
        highlight,
        mapLink,
        unEligibility: JSON.parse(unEligibility),
        availableSlot,
        pickUpAndDrop: Boolean(pickUpAndDrop),
        pickUpOnly: Boolean(pickUpOnly),
        dropOnly: Boolean(dropOnly),
        pickUpLocation,
        dropLocation,
        age,
      });

      res.status(201).json({ status: "created" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


module.exports = route;
