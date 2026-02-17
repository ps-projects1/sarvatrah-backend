const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { Pilgrimage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const Joi = require("joi");
const uploadToSupabase = require("../../utils/uploadToSupabase");

const addPilrimagePackage = async (req, res) => {
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
      refundableTerms,
      include,
      exclude,
      basePrice,
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
      basePrice: Joi.number().min(0).default(0),
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
      basePrice,
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
    const existingPackage = await Pilgrimage.findOne({
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
        // Support both hotel_id (direct) and hotels[] array (from admin UI)
        const resolvedHotelId = item.hotel_id || (item.hotels && item.hotels.length > 0 ? item.hotels[0].hotel_id : null);

        if (resolvedHotelId) {
          const hotel = await hotelCollection.findById(resolvedHotelId);

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

          // Keep admin's selection
          selectedHotel = resolvedHotelId;
          item.hotel_id = resolvedHotelId;
          console.log(
            `✅ Day ${item.dayNo}: Using admin-selected hotel: ${hotel.hotelName} (${hotel._id})`
          );
        } else {
          // Fallback: use default hotel for this location
          const fallbackState = typeof item.state === 'object' ? item.state.name : item.state;
          const fallbackCity = typeof item.city === 'object' ? item.city.name : item.city;
          const existingDefaultHotel = await hotelCollection.findOne({
            state: fallbackState,
            city: fallbackCity,
            defaultSelected: true,
          });

          if (!existingDefaultHotel) {
            return res.status(400).json(
              generateErrorResponse(
                `No hotel selected for day ${item.dayNo} in ${fallbackState}, ${fallbackCity}. Please select a hotel.`
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

    // Upload theme image to Supabase
    let themeImgPath;
    try {
      themeImgPath = await uploadToSupabase(
        req.files.themeImg[0].path,
        req.files.themeImg[0].originalname,
        "pilgrimage/theme"
      );
    } catch (uploadError) {
      console.warn("Supabase upload failed, using local path:", uploadError.message);
      themeImgPath = `https://sarvatrah-backend.onrender.com/public/${convertPath(req.files.themeImg[0].path)}`;
    }

    const themeImg = {
      filename: req.files.themeImg[0].filename,
      path: themeImgPath,
      mimetype: req.files.themeImg[0].mimetype,
    };

    // Upload additional images to Supabase
    const images = [];
    if (req.files.packageImages) {
      for (const file of req.files.packageImages) {
        let filePath;
        try {
          filePath = await uploadToSupabase(
            file.path,
            file.originalname,
            "pilgrimage/gallery"
          );
        } catch (uploadError) {
          console.warn("Supabase upload failed, using local path:", uploadError.message);
          filePath = `https://sarvatrah-backend.onrender.com/public/${convertPath(file.path)}`;
        }
        images.push({
          filename: file.filename,
          path: filePath,
          mimetype: file.mimetype,
        });
      }
    }
    

    // Create a new holiday package
    const newPilgrimagePackage = new Pilgrimage({
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
      refundableTerms: refundableTerms || "",
      roomLimit,
      include,
      exclude,
      itinerary,
      basePrice: basePrice || 0,
      priceMarkup: priceMarkup || 0,
      inflatedPercentage: inflatedPercentage || 0,
      active: active || false,
      startCity: startCity ? startCity.trim() : "",
      themeImg,
      images,
      vehiclePrices: vehicles,
    });

    // Save the new package to the database
    const savedPackage = await newPilgrimagePackage.save();

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

module.exports = { addPilrimagePackage };
