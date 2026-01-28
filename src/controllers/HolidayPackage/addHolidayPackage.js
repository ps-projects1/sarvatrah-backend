const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const Joi = require("joi");

const addHolidayPackage = async (req, res) => {
  try {
    //themeImg images
    let {
      objectType,
      packageName,
      days,
      nights,
      selectType,
      uniqueId,
      packageType,
      destinationCity,
      highlights,
      createPilgrimage,
      displayHomepage,
      recommendedPackage,
      roomLimit,
      partialPayment,
      partialPaymentDueDays,
      partialPaymentPercentage,
      cancellationPolicyType,
      refundablePercentage,
      refundableDays,
      include,
      exclude,
      priceMarkup,
      inflatedPercentage,
      active,
      vehicles,
      startCity,
      itinerary,
    } = req.body;
    let selectedHotel;
    
    itinerary = await JSON.parse(JSON.stringify(JSON.parse(itinerary)));
    destinationCity = JSON.parse(destinationCity);
    vehicles = JSON.parse(vehicles);

    // Validate required fields
    const schema = Joi.object({
      objectType: Joi.string().required(),
      packageName: Joi.string().required(),
      days: Joi.number().min(1).required(),
      nights: Joi.number().min(0).required(),
      selectType: Joi.string()
        .valid("domestic", "international", "both")
        .required(),
      uniqueId: Joi.string().required(),
      packageType: Joi.string()
        .valid(
          "family",
          "honeymoon",
          "adventure",
          "luxury",
          "budget",
          "group",
          "custom"
        )
        .required(),
      destinationCity: Joi.array().items(Joi.string()).required(),
      highlights: Joi.string().required(),
      createPilgrimage: Joi.boolean().default(false),
      displayHomepage: Joi.boolean().default(false),
      partialPayment: Joi.boolean().default(false),
      recommendedPackage: Joi.boolean().default(false),
      partialPaymentDueDays: Joi.number().min(0).default(0),
      partialPaymentPercentage: Joi.number().min(0).max(100).default(0),
      cancellationPolicyType: Joi.string()
        .valid("refundble", "non-refundble")
        .default("non-refundble"),
      roomLimit: Joi.number().min(1).required(),
      refundablePercentage: Joi.number().default(0),
      refundableDays: Joi.number().default(0),
      include: Joi.string(),
      exclude: Joi.string(),
      itinerary: Joi.array().items(Joi.object()).required(),
      priceMarkup: Joi.number().default(0),
      inflatedPercentage: Joi.number().default(0),
      active: Joi.boolean().default(false),
      startCity: Joi.string().trim(),
      vehicles: Joi.array().items(Joi.string()),
    });

    const { error } = schema.validate({
      objectType,
      packageName,
      days,
      nights,
      selectType,
      uniqueId,
      packageType,
      destinationCity,
      highlights,
      createPilgrimage,
      displayHomepage,
      recommendedPackage,
      roomLimit,
      partialPayment,
      partialPaymentDueDays,
      partialPaymentPercentage,
      cancellationPolicyType,
      refundablePercentage,
      refundableDays,
      include,
      exclude,
      itinerary,
      priceMarkup,
      inflatedPercentage,
      active,
      startCity,
    });
    if (error) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", error.details[0].message)
        );
    }

    // Validate the images
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Validation Error",
            "At least one image is required"
          )
        );
    }

    // Check if theme image is provided
    if (!req.files.themeImg) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", "Theme image is required")
        );
    }

    // check if the package already exists with package name, selectType and uniqueId
    const existingPackage = await HolidayPackage.findOne({
      packageName: packageName,
      selectType: selectType,
      uniqueId: uniqueId,
    });

    if (existingPackage) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Package Already Exists",
            "Unique ID already exists"
          )
        );
    }

    // check refundable or not
    if (cancellationPolicyType === "refundble") {
      if (refundablePercentage <= 0 || refundableDays <= 0) {
        return res
          .status(400)
          .json(
            generateErrorResponse(
              "Validation Error",
              "For refundable packages, refundable percentage and refundable days must be greater than 0"
            )
          );
      }
    }

    // Check if vehicles are provided
    if (!vehicles || vehicles.length === 0) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Validation Error",
            "At least one vehicle ID is required"
          )
        );
    }

    // Validate each vehicle ID
    for (const x of vehicles) {   
      const existingVehicle = await vehicleCollection.findById(x.vehicle_id);
      if (!existingVehicle) {
        return res
          .status(404)
          .json(
            generateErrorResponse(
              "Invalid Vehicle ID",
              `Vehicle with ID ${x.vehicle_id} does not exist`
            )
          );
      }
    }
    // Validate hotel selections from admin
    for (const item of itinerary) {
      if (item.stay) {
        // If admin provided a hotel_id, validate it exists and is active
        if (item.hotel_id) {
          const hotel = await hotelCollection.findById(item.hotel_id);

          if (!hotel) {
            return res.status(400).json(
              generateErrorResponse(
                `Hotel not found for day ${item.dayNo}. Please select a valid hotel.`
              )
            );
          }

          if (!hotel.active) {
            return res.status(400).json(
              generateErrorResponse(
                `Hotel "${hotel.hotelName}" is inactive for day ${item.dayNo}. Please select an active hotel.`
              )
            );
          }

          // Validate location match
          if (hotel.state !== item.state || hotel.city !== item.city) {
            return res.status(400).json(
              generateErrorResponse(
                `Hotel location (${hotel.state}, ${hotel.city}) doesn't match day ${item.dayNo} location (${item.state}, ${item.city}). Please select a hotel from the correct location.`
              )
            );
          }

          // Keep admin's selection - don't override
          selectedHotel = item.hotel_id;
          console.log(
            `✅ Day ${item.dayNo}: Using admin-selected hotel: ${hotel.hotelName} (${hotel._id})`
          );
        } else {
          // Fallback: If admin didn't select hotel, use default hotel
          const existingDefaultHotel = await hotelCollection.findOne({
            state: item.state,
            city: item.city,
            defaultSelected: true,
          });

          if (!existingDefaultHotel) {
            return res.status(400).json(
              generateErrorResponse(
                `No hotel selected for day ${item.dayNo} in ${item.state}, ${item.city}. Please select a hotel.`
              )
            );
          }

          selectedHotel = existingDefaultHotel._id;
          item.hotel_id = selectedHotel;
          console.log(
            `ℹ️  Day ${item.dayNo}: No hotel selected, using default: ${existingDefaultHotel.hotelName} (${existingDefaultHotel._id})`
          );
        }
      }
    }

    // Process uploaded files
    const convertPath = (path) =>
      path.replace(/\\/g, "/").replace("public/", "");

    // Files
    const themeImg = {
      filename: req.files.themeImg[0].filename,
      path: `https://sarvatrah-backend.onrender.com/public/${convertPath(req.files.themeImg[0].path)}`,
      mimetype: req.files.themeImg[0].mimetype,
    };

    const images = req.files.packageImages.map((file) => ({
      filename: file.filename,
      path: `https://sarvatrah-backend.onrender.com/public/${convertPath(file.path)}`,
      mimetype: file.mimetype,
    }));
    

    // Create a new holiday package
    const newHolidayPackage = new HolidayPackage({
      objectType,
      packageName,
      packageDuration: {
        days,
        nights,
      },
      selectType,
      uniqueId,
      packageType,
      destinationCity,
      highlights,
      createPilgrimage: createPilgrimage || false,
      displayHomepage: displayHomepage || false,
      partialPayment: partialPayment || false,
      recommendedPackage: recommendedPackage || false,
      partialPaymentDueDays: partialPaymentDueDays || 0,
      partialPaymentPercentage: partialPaymentPercentage || 0,
      cancellationPolicyType: cancellationPolicyType || "non-refundble",
      refundablePercentage: refundablePercentage || 0,
      refundableDays: refundableDays || 0,
      roomLimit,
      include,
      exclude,
      itinerary,
      priceMarkup: priceMarkup || 0,
      inflatedPercentage: inflatedPercentage || 0,
      active: active || false,
      startCity: startCity ? startCity.trim() : "",
      themeImg,
      images,
      vehiclePrices: vehicles,
    });

    // Save the new package to the database
    const savedPackage = await newHolidayPackage.save();

    return res
      .status(201)
      .json(
        generateResponse(
          true,
          "Holiday Package added successfully",
          savedPackage
        )
      );
  } catch (error) {
    console.log("Add Holiday Package API :", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { addHolidayPackage };
