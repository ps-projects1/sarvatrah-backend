const express = require("express");
const route = express.Router();
const advantureCollection = require("../models/advanture");
const upload = require("../utils/file_upload/upload");

route.post(
  "/",
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req, res, next) => {
    console.log("Adventure creation endpoint hit");
    
    try {
      // Check if file exists
      if (!req.files || !req.files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Use req.body for FormData
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

      console.log('Received data for adventure creation');

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

      // Helper function to parse JSON strings
      const parseIfString = (data) => {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            return data;
          }
        }
        return data;
      };

      // Parse age from string to number for unEligibility
      const parsedUnEligibility = parseIfString(unEligibility);
      if (parsedUnEligibility && parsedUnEligibility.age) {
        parsedUnEligibility.age = parsedUnEligibility.age.map(a => parseInt(a)).filter(a => !isNaN(a));
      }

      // Parse vehicle prices to numbers
      const parsedVehicles = parseIfString(availableVehicle);
      if (Array.isArray(parsedVehicles)) {
        parsedVehicles.forEach(vehicle => {
          if (vehicle.price) {
            vehicle.price = parseInt(vehicle.price) || 0;
          }
        });
      }

      // Create adventure data according to schema
      const adventureData = {
        packageName,
        packageDuration,
        themeImg: { ...themeImg, path: themeImg.path.replace(/\\/g, "/") },
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
        pickUpAndDrop: pickUpAndDrop === 'true' || pickUpAndDrop === true,
        pickUpOnly: pickUpOnly === 'true' || pickUpOnly === true,
        dropOnly: dropOnly === 'true' || dropOnly === true,
        pickUpLocation,
        dropLocation,
        ageTypes: parseIfString(ageTypes) || {
          adult: false,
          children: false,
          senior: false,
        },
        age: parseIfString(age) || {
          adult: "",
          children: "",
          senior: "",
        },
        endpoint: endpoint || "",
        objectType: "advanture" // This is default in schema but including for clarity
      };

      console.log('Creating adventure with data:', adventureData);

      // Creating activity
      await advantureCollection.create(adventureData);

      res.status(201).json({ 
        status: "created",
        message: "Adventure created successfully"
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ 
        error: "Internal Server Error",
        details: error.message 
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