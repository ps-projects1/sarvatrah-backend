/**
 * 1)
 * 2)
 * 3)
 * 4)
 * 5) Take all itinerary with stay get the city and state and add the hotelId
 * 6) now base on that object select lowest price from the vehicle
 * 7) calculate the total price of the package for per person
 * 8) save the package
 * 9) return the response
 */

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
    for (const vehicleId of vehicles) {
      const existingVehicle = await vehicleCollection.findById(vehicleId);
      if (!existingVehicle) {
        return res
          .status(404)
          .json(
            generateErrorResponse(
              "Invalid Vehicle ID",
              `Vehicle with ID ${vehicleId} does not exist`
            )
          );
      }
    }

    itinerary = JSON.parse(itinerary);
    // Check default selected hotel
    for (const item of itinerary) {
      if (item.stay) {
        const existingDefaultHotel = await hotelCollection.findOne({
          state: item.state,
          city: item.city,
          defaultSelected: true,
        });

        if (!existingDefaultHotel) {
          return res
            .status(404)
            .json(
              generateErrorResponse(
                `Cannot found default selected hotel for ${item.state}, ${item.city}`
              )
            );
        }
        selectedHotel = existingDefaultHotel._id;
        itinerary.hotel_id = selectedHotel;
      }
    }

    // calculate the total price of the package for per person
    let totalPackagePrice = 0;
    let totalVehiclePrice = 0;
    let totalHotelPrice = 0;
    let totalInflatedPrice = 0;
    let totalPriceMarkup = 0;

    // lowest price from the vehicle
    const lowestVehiclePrices = vehicles.sort((a, b) => a.price - b.price)[0]
      .price;

    // hotel price from the selected hotel
    for (const item of itinerary) {
      if (item.stay && item.hotel_id) {
        const hotel = await hotelCollection.findById(item.hotel_id);
        if (hotel) {
          if(hotel.roomType == "standard"){
            totalHotelPrice += hotel.rooms.occupancyRates[0];
          }
        }
      }
    }

    totalPackagePrice += lowestVehiclePrices;
    

    // Process uploaded files
    const convertPath = (path) =>
      path.replace(/\\/g, "/").replace("public/", "");

    // Files
    const themeImg = {
      filename: req.files.themeImg[0].filename,
      path: `http://127.0.0.1:3232/${convertPath(req.files.themeImg[0].path)}`,
      mimetype: req.files.themeImg[0].mimetype,
    };

    const images = req.files.packageImages.map((file) => ({
      filename: file.filename,
      path: `http://127.0.0.1:3232/${convertPath(file.path)}`,
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
      vehicles,
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
