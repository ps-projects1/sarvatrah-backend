const express = require("express");
const route = express.Router();
const advantureCollection = require("../models/advanture");
const upload = require("../utils/file_upload/upload");
const uploadToSupabase = require("../utils/uploadToSupabase");
route.post(
  "/",
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req, res, next) => {
    console.log("Adventure creation endpoint hit");

    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

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
      } = req.body;

      console.log("Received data for adventure creation");

      // -------------------------------
      // 🔥 Upload theme image to Supabase
      // -------------------------------
      const themeFile = req.files.file[0];
      const themeImgUrl = await uploadToSupabase(
        themeFile.path, 
        themeFile.originalname, 
        "adventure/theme",
        "hotel-images"  // bucket name
      );

      const themeImg = {
        filename: themeFile.originalname,
        path: themeImgUrl,
        mimetype: themeFile.mimetype,
      };

      const parseIfString = (data) => {
        if (typeof data === "string") {
          try {
            return JSON.parse(data);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return data;
          }
        }
        return data;
      };

      const parsedUnEligibility = parseIfString(unEligibility);
      if (parsedUnEligibility && parsedUnEligibility.age) {
        parsedUnEligibility.age = parsedUnEligibility.age
          .map((a) => parseInt(a))
          .filter((a) => !isNaN(a));
      }

      const parsedVehicles = parseIfString(availableVehicle);
      if (Array.isArray(parsedVehicles)) {
        parsedVehicles.forEach((vehicle) => {
          if (vehicle.price) {
            vehicle.price = parseInt(vehicle.price) || 0;
          }
        });
      }

      const adventureData = {
        packageName,
        packageDuration,
        themeImg,
        availableVehicle: parsedVehicles,
        groupSize: parseInt(groupSize) || 0,
        include: parseIfString(include) || [],
        exclude: parseIfString(exclude) || [],
        startLocation,
        advantureLocation,
        discount: discount || "0",
        price: parseInt(price) || 0,
        overview,
        availableLanguage: parseIfString(availableLanguage) || [],
        cancellationPolicy,
        highlight,
        mapLink,
        unEligibility: parsedUnEligibility || { age: [], diseases: [] },
        availableSlot: parseInt(availableSlot) || 0,
        pickUpAndDrop: pickUpAndDrop === "true" || pickUpAndDrop === true,
        pickUpOnly: pickUpOnly === "true" || pickUpOnly === true,
        dropOnly: dropOnly === "true" || dropOnly === true,
        pickUpLocation,
        dropLocation,
        ageTypes: parseIfString(ageTypes) || { adult: false, children: false, senior: false },
        age: parseIfString(age) || { adult: "", children: "", senior: "" },
        endpoint: endpoint || "",
        objectType: "advanture",
      };

      console.log("Creating adventure with data:", adventureData);

      await advantureCollection.create(adventureData);

      res.status(201).json({
        status: "created",
        message: "Adventure created successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: error.message,
      });
    }
  }
);


// Keep your existing GET routes
route.get("/", async (req, res, next) => {
  const activityLists = await advantureCollection.find({});
  const response = activityLists.map((data) => {
    return {
      packageName: data.packageName,
      packageDuration: data.packageDuration,
      startLocation: data.startLocation,
      advantureLocation: data.advantureLocation,
      price: data.price,
      themeImg: data.themeImg.path,
      _id: data._id,
    };
  });
  res.status(200).json({ data: response });
});

route.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  const advanture = await advantureCollection.findById(id);
  res.status(200).json({ data: advanture });
});

module.exports = route;