const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const Joi = require("joi");
const uploadToSupabase = require("../../utils/uploadToSupabase");

const {
  writeLog,
} = require("../../utils/debugLogger");

const {
  calculateRecommendedPackagePrice,
} = require("../../utils/packagePricingCalculator");

const updateHolidayPackage = async (req, res) => {
  try {
    const {
      _id,
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
      availableVehicle,
      startCity,
      itinerary,
    } = req.body;

    // Validate _id is provided
    if (!_id) {
      return res
        .status(400)
        .json(
          generateErrorResponse("Validation Error", "_id is required for update")
        );
    }

    // Find existing package
    const existingPackage = await HolidayPackage.findById(_id);
    if (!existingPackage) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "Package not found"));
    }

    // Parse JSON fields if they're strings
    let parsedItinerary = itinerary;
    let parsedDestinationCity = destinationCity;
    let parsedVehicles = vehicles || availableVehicle;

    try {
      if (typeof itinerary === "string") {
        parsedItinerary = JSON.parse(itinerary);
      }
      if (typeof destinationCity === "string") {
        parsedDestinationCity = JSON.parse(destinationCity);
      }
      if (typeof parsedVehicles === "string") {
        parsedVehicles = JSON.parse(parsedVehicles);
      }

    } catch (parseError) {
      return res
        .status(400)
        .json(
          generateErrorResponse(
            "Validation Error",
            "Invalid JSON format in itinerary, destinationCity, or vehicles"
          )
        );
    }

    console.log(
      "parsedVehicles AFTER PARSE:",
      JSON.stringify(parsedVehicles, null, 2)
    );

    writeLog({
      type: "parsedVehicles AFTER PARSE",
      body: JSON.stringify(parsedVehicles, null, 2),
    });

    // Validate vehicles if provided
    if (parsedVehicles && Array.isArray(parsedVehicles)) {
      for (const v of parsedVehicles) {
        if (v.vehicle_id) {
          const existingVehicle = await vehicleCollection.findById(v.vehicle_id);
          if (!existingVehicle) {
            return res
              .status(404)
              .json(
                generateErrorResponse(
                  "Invalid Vehicle ID",
                  `Vehicle with ID ${v.vehicle_id} does not exist`
                )
              );
          }
        }
      }
    }

    // ============================================================
    // VALIDATE ITINERARY FOR RECOMMENDED PRICING
    // ============================================================

    // Hotels no longer need to be configured in item.hotels.
    // Recommended pricing searches the Hotel collection by city
    // and state instead.
    //
    // Keep the existing stay-day behavior. Only validate city
    // and state when a new itinerary is provided.

    if (parsedItinerary && Array.isArray(parsedItinerary)) {
      for (const item of parsedItinerary) {
        if (!item.stay) {
          continue;
        }

        const city =
          typeof item.city === "object"
            ? item.city?.name
            : item.city;

        const state =
          typeof item.state === "object"
            ? item.state?.name
            : item.state;

        if (
          !String(city || "").trim() ||
          !String(state || "").trim()
        ) {
          return res.status(400).json(
            generateErrorResponse(
              "Validation Error",
              `City and state are required for stay day ${item.dayNo ?? "unknown"}`
            )
          );
        }
      }
    }

    // Handle file uploads
    // ===================================
    // HANDLE FILES
    // ===================================

    const themeFile =
      req.files?.themeImage?.[0];

    const additionalFiles =
      req.files?.files || [];

    const convertPath = path =>
      path
        .replace(/\\/g, "/")
        .replace("public/", "");

    // THEME IMAGE

    if (themeFile) {

      let themeImgPath;

      try {

        themeImgPath =
          await uploadToSupabase(
            themeFile.path,
            themeFile.originalname,
            "holiday/theme"
          );

      } catch (err) {

        themeImgPath =
          `https://sarvatrah-backend.onrender.com/public/${convertPath(themeFile.path)}`;
      }

      existingPackage.themeImg = {

        filename:
          themeFile.filename,

        path:
          themeImgPath,

        mimetype:
          themeFile.mimetype,
      };
    }

    // GALLERY IMAGES

    if (additionalFiles.length) {

      const uploadedImages = [];

      for (const file of additionalFiles) {

        let fileUrl;

        try {

          fileUrl =
            await uploadToSupabase(
              file.path,
              file.originalname,
              "holiday/gallery"
            );

        } catch (err) {

          fileUrl =
            `https://sarvatrah-backend.onrender.com/public/${convertPath(file.path)}`;
        }

        uploadedImages.push({

          filename:
            file.filename,

          path:
            fileUrl,

          mimetype:
            file.mimetype,
        });
      }

      existingPackage.images = [

        ...(existingPackage.images || []),

        ...uploadedImages,
      ];
    }

    // ===================================
// VEHICLE IMAGE UPLOAD TO SUPABASE
// ===================================

const vehicleImageFile = req.files?.vehicleImages?.[0];
const vehicleImageIndex = Number(req.body.vehicleImageIndex);

if (vehicleImageFile) {
  // Validate the vehicle index.
  if (
    !Number.isInteger(vehicleImageIndex) ||
    vehicleImageIndex < 0 ||
    !Array.isArray(parsedVehicles) ||
    vehicleImageIndex >= parsedVehicles.length
  ) {
    return res.status(400).json(
      generateErrorResponse(
        "Validation Error",
        "Invalid vehicleImageIndex"
      )
    );
  }

  const selectedVehicle = parsedVehicles[vehicleImageIndex];

  if (!selectedVehicle?.vehicle_id) {
    return res.status(400).json(
      generateErrorResponse(
        "Validation Error",
        `No vehicle ID found at index ${vehicleImageIndex}`
      )
    );
  }

  // Find the actual vehicle document.
  const vehicleDoc = await vehicleCollection.findById(
    selectedVehicle.vehicle_id
  );

  if (!vehicleDoc) {
    return res.status(404).json(
      generateErrorResponse(
        "Vehicle Not Found",
        `Vehicle ${selectedVehicle.vehicle_id} does not exist`
      )
    );
  }

  // Upload to Supabase.
  // Do not silently fall back to a local URL if the upload fails.
  const vehicleImageUrl = await uploadToSupabase(
    vehicleImageFile.path,
    vehicleImageFile.originalname,
    "vehicles"
  );

  if (
    typeof vehicleImageUrl !== "string" ||
    !vehicleImageUrl.startsWith("https://")
  ) {
    throw new Error(
      "Vehicle image upload did not return a valid Supabase URL"
    );
  }

  // Save the Supabase URL to the vehicle record.
  vehicleDoc.img = [
    ...(vehicleDoc.img || []),
    vehicleImageUrl,
  ];

  await vehicleDoc.save();

  console.log("Vehicle image uploaded successfully:", {
    vehicleId: vehicleDoc._id,
    imageUrl: vehicleImageUrl,
    vehicleImageIndex,
  });

  writeLog({
    type: "Vehicle image uploaded to Supabase",
    body: JSON.stringify({
      vehicleId: vehicleDoc._id,
      imageUrl: vehicleImageUrl,
      vehicleImageIndex,
    }),
  });
}

    // Update fields (only if provided)
    if (objectType !== undefined) existingPackage.objectType = objectType;
    if (packageName !== undefined) existingPackage.packageName = packageName;
    if (days !== undefined || nights !== undefined) {
      existingPackage.packageDuration = {
        days: days !== undefined ? parseInt(days) : existingPackage.packageDuration.days,
        nights: nights !== undefined ? parseInt(nights) : existingPackage.packageDuration.nights,
      };
    }
    if (selectType !== undefined) existingPackage.selectType = selectType;
    if (uniqueId !== undefined) existingPackage.uniqueId = uniqueId;
    if (packageType !== undefined) existingPackage.packageType = packageType;
    if (parsedDestinationCity !== undefined) existingPackage.destinationCity = parsedDestinationCity;
    if (highlights !== undefined) existingPackage.highlights = highlights;
    if (createPilgrimage !== undefined) existingPackage.createPilgrimage = createPilgrimage === "true" || createPilgrimage === true;
    if (displayHomepage !== undefined) existingPackage.displayHomepage = displayHomepage === "true" || displayHomepage === true;
    if (recommendedPackage !== undefined) existingPackage.recommendedPackage = recommendedPackage === "true" || recommendedPackage === true;
    if (roomLimit !== undefined) existingPackage.roomLimit = parseInt(roomLimit);
    if (partialPayment !== undefined) existingPackage.partialPayment = partialPayment === "true" || partialPayment === true;
    if (partialPaymentDueDays !== undefined) existingPackage.partialPaymentDueDays = parseInt(partialPaymentDueDays);
    if (partialPaymentPercentage !== undefined) existingPackage.partialPaymentPercentage = parseFloat(partialPaymentPercentage);
    if (cancellationPolicyType !== undefined) existingPackage.cancellationPolicyType = cancellationPolicyType;
    if (refundablePercentage !== undefined) existingPackage.refundablePercentage = parseFloat(refundablePercentage);
    if (refundableDays !== undefined) existingPackage.refundableDays = parseInt(refundableDays);
    if (refundableTerms !== undefined) existingPackage.refundableTerms = refundableTerms;
    if (include !== undefined) existingPackage.include = include;
    if (exclude !== undefined) existingPackage.exclude = exclude;
    // if (basePrice !== undefined) existingPackage.basePrice = parseFloat(basePrice);
    if (priceMarkup !== undefined) existingPackage.priceMarkup = parseFloat(priceMarkup);
    if (inflatedPercentage !== undefined) existingPackage.inflatedPercentage = parseFloat(inflatedPercentage);
    if (active !== undefined) existingPackage.active = active === "true" || active === true;
    if (startCity !== undefined) existingPackage.startCity = startCity;

    if (parsedItinerary !== undefined) {
      existingPackage.itinerary = parsedItinerary;
    }

    if (
      Array.isArray(parsedVehicles)
    ) {

      existingPackage.vehiclePrices =
        parsedVehicles;

      existingPackage.availableVehicle =
        parsedVehicles;
    }

    // ===================================
    // RECALCULATE PACKAGE COST
    // ===================================

    console.log(
      "parsedVehicles:",
      JSON.stringify(parsedVehicles, null, 2)
    );

    writeLog({
      type: "parsedVehicles",
      body: JSON.stringify(parsedVehicles, null, 2),
    });

    console.log(
      "vehiclePrices before calc:",
      JSON.stringify(
        existingPackage.vehiclePrices,
        null,
        2
      )
    );

    writeLog({
      type: "vehiclePrices before calc",
      body: JSON.stringify(
        existingPackage.vehiclePrices,
        null,
        2
      )
    });

    console.log(
      "itinerary before calc:",
      JSON.stringify(
        existingPackage.itinerary,
        null,
        2
      )
    );

    writeLog({
      type: "itinerary before calc",
      body: JSON.stringify(
        existingPackage.itinerary,
        null,
        2
      )
    });

    console.log(
      "recommendedPricing calc input:",
      {
        hotels:
          existingPackage.itinerary,
        vehicles:
          existingPackage.vehiclePrices,
        inflation:
          existingPackage.inflatedPercentage,
      }
    );

    writeLog({
      type: "recommendedPricing calc input:",
      body: {
        hotels:
          existingPackage.itinerary,
        vehicles:
          existingPackage.vehiclePrices,
        inflation:
          existingPackage.inflatedPercentage,
      }
    });

    const pricing =
      await calculateRecommendedPackagePrice(
        existingPackage.itinerary,
        existingPackage.vehiclePrices,
        existingPackage.priceMarkup,
        existingPackage.inflatedPercentage
      );

    existingPackage.recommendedPricing =
      pricing;

    existingPackage.basePrice =
      pricing.finalCost;

    // ===================================
    // SAVE
    // ===================================

    const updatedPackage =
      await existingPackage.save();

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Holiday Package updated successfully",
          updatedPackage
        )
      );
  } catch (error) {
    console.error("Update Holiday Package API Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { updateHolidayPackage };
