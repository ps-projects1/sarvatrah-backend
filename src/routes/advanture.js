const express = require("express");
// const packageCollection = require('../models/holidaysPackage');
const upload = require("../utils/file_upload/upload");
const route = express.Router();
const jwt = require("jsonwebtoken");
const advantureCollection = require("../models/advanture");

route.get("/", async (req, res, next) => {
  const activityLists = await advantureCollection.find({});
  const response = activityLists.map((data) => {
    return {
      packageName: data.packageName,
      packageDuration: data.packageDuration,
      startLocation: data.startLocation,
      activityLocation: data.activityLocation,
      price: data.price,
      themeImg: data.themeImg.path,
      _id: data._id,
    };
  });
  res.status(200).json({ data: response });
});

route.post(
  "/",
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req, res, next) => {
    console.log("ssssssssssssssssssssss");
    res.status(201);
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
        advantureLocation,
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
        endpoint,
      } = req.query;

      // Extracting file information
      const themeImg = {
        filename: req.files.file[0].filename,
        path:
          "http://127.0.0.1:3232/" +
          req.files.file[0].path
            .replace("public\\", "")
            .replace(/\\/g, "/")
            .replace(/\//g, "/"),
        mimetype: req.files.file[0].mimetype,
      };

      // Creating activity
      await advantureCollection.create({
        packageName,
        packageDuration,
        themeImg: { ...themeImg, path: themeImg.path.replace(/\\/g, "/") },
        availableVehicle: JSON.parse(availableVehicle),
        groupSize,
        include: JSON.parse(include),
        exclude: JSON.parse(exclude),
        startLocation,
        advantureLocation,
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
        ageTypes: {
          adult: Boolean(ageTypes.adult),
          children: Boolean(ageTypes.children),
          senior: Boolean(ageTypes.senior),
        },
        age,
        endpoint,
      });

      res.status(201).json({ status: "created" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

route.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  const advanture = await advantureCollection.findById(id);
  res.status(200).json({ data: advanture });
});

module.exports = route;
