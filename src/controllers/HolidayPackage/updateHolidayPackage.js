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

    // Validate hotel selections from itinerary if provided
    if (parsedItinerary && Array.isArray(parsedItinerary)) {

      for (const item of parsedItinerary) {

        if (!item.stay) {
          continue;
        }

        if (
          !Array.isArray(item.hotels) ||
          !item.hotels.length
        ) {
          return res.status(400).json(
            generateErrorResponse(
              "Validation Error",
              `At least one hotel is required for day ${item.dayNo}`
            )
          );
        }

        for (const hotelOption of item.hotels) {

          const hotel =
            await hotelCollection.findById(
              hotelOption.hotel_id
            );

          if (!hotel) {

            return res.status(400).json(
              generateErrorResponse(
                "Validation Error",
                `Hotel not found for day ${item.dayNo}`
              )
            );
          }

          if (!hotel.active) {

            return res.status(400).json(
              generateErrorResponse(
                "Validation Error",
                `Hotel ${hotel.hotelName} is inactive`
              )
            );
          }
        }
      }
    }

    // Handle file uploads
    const convertPath = (path) =>
      path.replace(/\\/g, "/").replace("public/", "");

    // Update theme image if provided
    if (req.files && req.files.length > 0) {
      const themeFile = req.files[0];

      // Upload to Supabase or use local path
      let themeImgPath;
      try {
        themeImgPath = await uploadToSupabase(
          themeFile.path,
          themeFile.originalname,
          "holiday/theme"
        );
      } catch (uploadError) {
        console.warn("Supabase upload failed, using local path:", uploadError.message);
        themeImgPath = `https://sarvatrah-backend.onrender.com/public/${convertPath(themeFile.path)}`;
      }

      existingPackage.themeImg = {
        filename: themeFile.filename,
        path: themeImgPath,
        mimetype: themeFile.mimetype,
      };

      // Handle additional images
      if (req.files.length > 1) {
        const additionalImages = [];
        for (let i = 1; i < req.files.length; i++) {
          const file = req.files[i];
          let filePath;

          try {
            filePath = await uploadToSupabase(
              file.path,
              file.originalname,
              "holiday/gallery"
            );
          } catch (uploadError) {
            console.warn("Supabase upload failed, using local path:", uploadError.message);
            filePath = `https://sarvatrah-backend.onrender.com/public/${convertPath(file.path)}`;
          }

          additionalImages.push({
            filename: file.filename,
            path: filePath,
            mimetype: file.mimetype,
          });
        }

        // Append new images to existing ones
        existingPackage.images = [...existingPackage.images, ...additionalImages];
      }
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

    console.log(
      "vehiclePrices before calc:",
      JSON.stringify(
        existingPackage.vehiclePrices,
        null,
        2
      )
    );

    console.log(
      "itinerary before calc:",
      JSON.stringify(
        existingPackage.itinerary,
        null,
        2
      )
    );

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

    const pricing =
      await calculateRecommendedPackagePrice(
        existingPackage.itinerary,
        existingPackage.vehiclePrices,
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
