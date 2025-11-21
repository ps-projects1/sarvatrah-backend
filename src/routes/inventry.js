const express = require("express");
const { hotelCollection, Category } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
// const multer = require('multer')
const upload = require("../utils/file_upload/upload");
const jwt = require("jsonwebtoken");

const route = express.Router();
const { v4: uuidv4 } = require("uuid");
const imgID = uuidv4();

route.get("/", (req, res, next) => {
  res.status(200).json({
    message: "inventries homepage",
    data: req.params,
  });
});

route.post("/vehicle", upload.single("file"), async (req, res, next) => {
  try {
    const {
      vehicleType,
      brandName = "",
      modelName = "",
      inventory = "",
      seatLimit = 0,
      luggageCapacity = 0,
      rate = 0,
      active,
      facilties,
      vehicleCategory,
      city,
    } = req.query;

    // Parse facilities if they are sent as JSON
    let facilitiesParsed = facilties;
    if (facilties && typeof facilties === "string") {
      try {
        facilitiesParsed = JSON.parse(facilties);
      } catch (e) {
        return res.status(400).json({ error: "Invalid facilities format" });
      }
    }

    // Create vehicle document
    const addVehicle = await vehicleCollection.create({
      vehicleType,
      brandName,
      modelName,
      inventory,
      seatLimit,
      luggageCapacity,
      rate,
      active,
      city,
      facilties: facilitiesParsed,
      vehicleCategory,
      img: req.file
        ? {
            filename: req.file.filename,
            path:
              "http://127.0.0.1:3232/" + req.file.path.replace("public/", ""),
            mimetype: req.file.mimetype,
          }
        : null,
    });
    res.status(200).json({
      data: addVehicle,
      message: "Vehicle added successfully",
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

route.post("/categories", async (req, res) => {
  try {
    const { categoryType, name } = req.query;
    console.log("categoryType, name", { categoryType, name });
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

route.get("/getVehicleDetails/:id", async (req, res) => {
  let id = req.params.id;
  console.log(id, typeof id);

  if (!id) {
    return res.send({ success: false, message: "Id is required" });
  }

  try {
    let vehicleObj = await vehicleCollection.findById(id);
    if (!vehicleObj) {
      return res.send({ success: false, message: "Vehicle not found" });
    }
    return res.send({ success: true, message: "", data: vehicleObj });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
});

route.post("/hotel", upload.array("files", 10), async (req, res, next) => {
  let getRoomInfo = req.body.rooms;
  const decryptRoomInfo = JSON.parse(getRoomInfo);
  const rooms = decryptRoomInfo;

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

  const imgs = req.files.map((file) => {
    return {
      filename: file.filename,
      path:
        "http://127.0.0.1:3232/" +
        file.path.replace(/\\/g, "/").replace("public/", ""),
      mimetype: file.mimetype,
    };
  });

  let objToBeAdded = {
    hotelType: hotelType,
    hotelName: hotelName,
    address: address,
    state: state,
    city: city,
    pincode: pincode,
    phoneNumber: phoneNumber,
    email: email,
    contactPerson: contactPerson,
    description: description,
    imgs: imgs,
    rooms: rooms,
  };

  //console.log(objToBeAdded);
  let hotelObj = await hotelCollection.create(objToBeAdded);

  return res.status(200).json({ Status: "Hotel uploaded", data: hotelObj });
});

route.get("/getHotelDetails/:id", async (req, res) => {
  let id = req.params.id;
  if (!id) {
    return res.send({ success: false, message: "Id is required" });
  }

  try {
    let hotelObj = await hotelCollection.findById(id);
    return res.send({ success: true, message: "", data: hotelObj });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
});

route.get("/getHotelList", async (req, res) => {
  let { city } = req.query;

  if (!city) {
    return res
      .status(400)
      .send({ success: false, message: "City parameter is required" });
  }

  if (!Array.isArray(city)) {
    city = [city]; // If city is not an array, convert it to an array
  }

  try {
    let hotelList = await hotelCollection.find({ city: { $in: city } });
    return res
      .status(200)
      .send({ success: true, message: "", data: hotelList });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});

route.get("/getCity", async (req, res) => {
  try {
    // Use the distinct method to get all unique city names from the hotelCollection
    let cities = await hotelCollection.distinct("city");
    return res.status(200).send({ success: true, message: "", data: cities });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
});

module.exports = route;
