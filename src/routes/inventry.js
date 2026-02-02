const express = require("express");
const { hotelCollection, Category } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
const upload = require("../utils/file_upload/upload");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");
const jwt = require("jsonwebtoken");
const uploadToSupabase = require("../utils/uploadToSupabase");

const route = express.Router();
const { v4: uuidv4 } = require("uuid");
const imgID = uuidv4();

// Home route
route.get("/", generalLimiter, (req, res, next) => {
  res.status(200).json({
    message: "inventries homepage",
    data: req.params,
  });
});

// Add vehicle → apply conditional uploadLimiter
route.post(
  "/vehicle",
  upload.array("images", 10),
  limitIfFiles(uploadLimiter),
  async (req, res) => {
    try {
      console.log("BODY RECEIVED:", req.body);
      console.log("FILES RECEIVED:", req.files);

      const { 
        vehicleType,
        brandName = "",
        modelName = "",
        inventory = 0,
        seatLimit = 0,
        luggageCapacity = 0,
        rate = 0,
        active = "false",
        facilties,
        vehicleCategory = "",
        city = "",
      } = req.body;

      // Parse facilities
      let facilitiesParsed = facilties;
      if (facilties && typeof facilties === "string") {
        try {
          facilitiesParsed = JSON.parse(facilties);
        } catch (e) {
          facilitiesParsed = facilties;
        }
      }

      // ==============================
      // 🚀 UPLOAD IMAGES TO SUPABASE
      // ==============================
      const images = [];
      for (const file of (req.files || [])) {
        const fileUrl = await uploadToSupabase(
          file.path,
          file.originalname,
          "vehicle/gallery",
          "hotel-images"  // bucket name
        );

        images.push({
          filename: file.filename,
          path: fileUrl,        // Supabase URL
          mimetype: file.mimetype,
        });
      }

      // Create Vehicle
      const addVehicle = await vehicleCollection.create({
        vehicleType,
        brandName,
        modelName,
        inventory: Number(inventory),
        seatLimit: Number(seatLimit),
        luggageCapacity: Number(luggageCapacity),
        rate: Number(rate),
        active: active === "true" || active === true,
        city,
        facilties: facilitiesParsed,
        vehicleCategory,
        img: images,
      });

      return res.status(200).json({
        success: true,
        data: addVehicle,
        message: "Vehicle added successfully",
      });
    } catch (error) {
      console.error("Error adding vehicle:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);


// Add category → generalLimiter
route.post("/categories", generalLimiter, async (req, res) => {
  try {
    const { categoryType, name } = req.query;
    const newCategory = new Category({ category: categoryType, name });
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ success: false, message: "Failed to add category" });
  }
});

// Get vehicle details → generalLimiter
route.get("/getVehicleDetails/:id", generalLimiter, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.send({ success: false, message: "Id is required" });

  try {
    const vehicleObj = await vehicleCollection.findById(id);
    if (!vehicleObj) return res.send({ success: false, message: "Vehicle not found" });
    return res.send({ success: true, message: "", data: vehicleObj });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
});

// Add hotel → conditional uploadLimiter
route.post(
  "/hotel",
  upload.array("files", 10),
  limitIfFiles(uploadLimiter),
  async (req, res, next) => {
    try {
      const getRoomInfo = req.body.rooms;
      const rooms = JSON.parse(getRoomInfo);

      const hotelType = req.body.hotelType;
      const hotelName = req.body.hotelName;
      const address = req.body.address;
      const state = req.body.state;
      const city = req.body.city;
      const pincode = req.body.pincode;
      const phoneNumber = req.body.phoneNumber;
      const email = req.body.email;
      const contactPerson = req.body.contactPerson;
      const description = req.body.description;

      // ==================================
      // 🚀 UPLOAD HOTEL IMAGES TO SUPABASE
      // ==================================
      const imgs = [];
      for (const file of (req.files || [])) {
        const fileUrl = await uploadToSupabase(
          file.path,
          file.originalname,
          "hotel/gallery",
          "hotel-images"  // bucket name
        );

        imgs.push({
          filename: file.filename,
          path: fileUrl, // Supabase URL
          mimetype: file.mimetype,
        });
      }

      const objToBeAdded = {
        hotelType,
        hotelName,
        address,
        state,
        city,
        pincode,
        phoneNumber,
        email,
        contactPerson,
        description,
        imgs,
        rooms,
      };

      const hotelObj = await hotelCollection.create(objToBeAdded);
      return res.status(200).json({ Status: "Hotel uploaded", data: hotelObj });

    } catch (err) {
      console.error("HOTEL ADD ERROR:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);


// Get hotel details → generalLimiter
route.get("/getHotelDetails/:id", generalLimiter, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.send({ success: false, message: "Id is required" });

  try {
    const hotelObj = await hotelCollection.findById(id);
    return res.send({ success: true, message: "", data: hotelObj });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
});

// Get hotel list → generalLimiter
route.get("/getHotelList", generalLimiter, async (req, res) => {
  let { city } = req.query;
  if (!city)
    return res.status(400).send({ success: false, message: "City parameter is required" });

  if (!Array.isArray(city)) city = [city];

  try {
    const hotelList = await hotelCollection.find({ city: { $in: city } });
    return res.status(200).send({ success: true, message: "", data: hotelList });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});

// Get all cities → generalLimiter
route.get("/getCity", generalLimiter, async (req, res) => {
  try {
    const cities = await hotelCollection.distinct("city");
    return res.status(200).send({ success: true, message: "", data: cities });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});

module.exports = route;
