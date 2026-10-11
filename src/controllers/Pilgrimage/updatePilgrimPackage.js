const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { Pilgrimage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const Joi = require("joi");
const uploadToSupabase = require("../../utils/uploadToSupabase");
const {
  calculateRecommendedPackagePrice,
} = require("../../utils/packagePricingCalculator");

const updatePilgrimage = async (req, res) => {
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
      priceMarkup,
      inflatedPercentage,
      active,
      vehicles,
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
    const existingPackage = await Pilgrimage.findById(_id);
    if (!existingPackage) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "Package not found"));
    }

    // Parse JSON fields if they're strings
    let parsedItinerary = itinerary;
    let parsedDestinationCity = destinationCity;
    let parsedVehicles = vehicles;

    try {
      if (typeof itinerary === "string") {
        parsedItinerary = JSON.parse(itinerary);
      }
      if (typeof destinationCity === "string") {
        parsedDestinationCity = JSON.parse(destinationCity);
      }
      if (typeof vehicles === "string") {
        parsedVehicles = JSON.parse(vehicles);
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


  // -----------------------------
  // Upload vehicle images to Supabase
  // -----------------------------
  const vehicleImageFiles = req.files?.vehicleImages || [];
  const rawVehicleImageIndexes = req.body.vehicleImageIndex;

  if (vehicleImageFiles.length > 0) {
    let vehicleImageIndexes = [];

    try {
      if (Array.isArray(rawVehicleImageIndexes)) {
        vehicleImageIndexes = rawVehicleImageIndexes.flatMap((value) => {
          const parsed =
            typeof value === "string" ? JSON.parse(value) : value;

          return Array.isArray(parsed) ? parsed : [parsed];
        });
      } else if (typeof rawVehicleImageIndexes === "string") {
        const parsed = JSON.parse(rawVehicleImageIndexes);
        vehicleImageIndexes = Array.isArray(parsed) ? parsed : [parsed];
      } else if (rawVehicleImageIndexes !== undefined) {
        vehicleImageIndexes = [rawVehicleImageIndexes];
      }
    } catch {
      return res.status(400).json(
        generateErrorResponse(
          "Validation Error",
          "Invalid vehicleImageIndex. Provide a numeric index or a JSON array of indexes."
        )
      );
    }

    if (vehicleImageIndexes.length !== vehicleImageFiles.length) {
      return res.status(400).json(
        generateErrorResponse(
          "Validation Error",
          "Provide one vehicleImageIndex for each vehicleImages file."
        )
      );
    }

    const vehiclesForImageMapping =
      parsedVehicles !== undefined
        ? parsedVehicles
        : existingPackage.vehiclePrices || [];

    for (let i = 0; i < vehicleImageFiles.length; i++) {
      const file = vehicleImageFiles[i];
      const vehicleIndex = Number(vehicleImageIndexes[i]);

      if (
        !Number.isInteger(vehicleIndex) ||
        vehicleIndex < 0 ||
        vehicleIndex >= vehiclesForImageMapping.length
      ) {
        return res.status(400).json(
          generateErrorResponse(
            "Validation Error",
            `Invalid vehicleImageIndex: ${vehicleImageIndexes[i]}`
          )
        );
      }

      const selectedVehicle = vehiclesForImageMapping[vehicleIndex];

      if (!selectedVehicle?.vehicle_id) {
        return res.status(400).json(
          generateErrorResponse(
            "Validation Error",
            `No vehicle_id found at vehicle index ${vehicleIndex}`
          )
        );
      }

      const vehicleDoc = await vehicleCollection.findById(
        selectedVehicle.vehicle_id
      );

      if (!vehicleDoc) {
        return res.status(404).json(
          generateErrorResponse(
            "Vehicle Not Found",
            `Vehicle with ID ${selectedVehicle.vehicle_id} does not exist`
          )
        );
      }

      const imageUrl = await uploadToSupabase(
        file.path,
        file.originalname,
        "vehicles"
      );

      if (
        typeof imageUrl !== "string" ||
        !imageUrl.startsWith("https://")
      ) {
        throw new Error(
          `Supabase upload failed for vehicle index ${vehicleIndex}`
        );
      }

      // img must contain objects, not raw URL strings.
      vehicleDoc.img = vehicleDoc.img || [];
      vehicleDoc.img.push({
        filename: file.originalname,
        path: imageUrl,
        mimetype: file.mimetype,
      });

      await vehicleDoc.save();

      console.log("Pilgrimage vehicle image updated:", {
        vehicleId: vehicleDoc._id,
        vehicleIndex,
        imageUrl,
      });
    }
  }


    
  // -----------------------------
  // Validate hotel selections
  // -----------------------------
  if (Array.isArray(parsedItinerary)) {
    for (const item of parsedItinerary) {
      if (!item.stay) continue;

      const resolvedHotelId =
        item.hotel_id ||
        (item.hotels?.length > 0 ? item.hotels[0].hotel_id : null);

      if (!resolvedHotelId) {
        return res.status(400).json(
          generateErrorResponse(
            "Validation Error",
            `Hotel is required for day ${item.dayNo}`
          )
        );
      }

      const hotel = await hotelCollection.findById(resolvedHotelId);

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
            `Hotel "${hotel.hotelName}" is inactive`
          )
        );
      }

      item.hotel_id = resolvedHotelId;
    }
  }


    // Handle file uploads
    const convertPath = (path) =>
      path.replace(/\\/g, "/").replace("public/", "");

    // Update theme image if provided (req.files is object from upload.fields())
    if (req.files && req.files.themeImg && req.files.themeImg.length > 0) {
      const themeFile = req.files.themeImg[0];

      let themeImgPath;
      try {
        themeImgPath = await uploadToSupabase(
          themeFile.path,
          themeFile.originalname,
          "pilgrimage/theme"
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
    }

    // Handle additional images if provided
    if (req.files && req.files.packageImages && req.files.packageImages.length > 0) {
      const additionalImages = [];
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

        additionalImages.push({
          filename: file.filename,
          path: filePath,
          mimetype: file.mimetype,
        });
      }

      // Append new images to existing ones
      existingPackage.images = [...existingPackage.images, ...additionalImages];
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

    
  if (priceMarkup !== undefined) {
    const parsedMarkup = Number(priceMarkup);

    if (!Number.isFinite(parsedMarkup) || parsedMarkup < 0) {
      return res.status(400).json(
        generateErrorResponse(
          "Validation Error",
          "priceMarkup must be a valid non-negative number"
        )
      );
    }

    existingPackage.priceMarkup = parsedMarkup;
  }

  if (inflatedPercentage !== undefined) {
    const parsedInflation = Number(inflatedPercentage);

    if (!Number.isFinite(parsedInflation) || parsedInflation < 0) {
      return res.status(400).json(
        generateErrorResponse(
          "Validation Error",
          "inflatedPercentage must be a valid non-negative number"
        )
      );
    }

    existingPackage.inflatedPercentage = parsedInflation;
  }


    if (active !== undefined) existingPackage.active = active === "true" || active === true;
    if (startCity !== undefined) existingPackage.startCity = startCity;
    if (parsedItinerary !== undefined) existingPackage.itinerary = parsedItinerary;
    if (parsedVehicles !== undefined) existingPackage.vehiclePrices = parsedVehicles;

    
  // -----------------------------
  // Recalculate recommended pricing
  // -----------------------------
  const pricingVehicles =
    existingPackage.vehiclePrices || [];

  const normalizedMarkup = Number(existingPackage.priceMarkup ?? 0);
  const normalizedInflation = Number(
    existingPackage.inflatedPercentage ?? 0
  );

  if (
    !Number.isFinite(normalizedMarkup) ||
    normalizedMarkup < 0 ||
    !Number.isFinite(normalizedInflation) ||
    normalizedInflation < 0
  ) {
    return res.status(400).json(
      generateErrorResponse(
        "Validation Error",
        "Price markup and inflation percentage must be valid non-negative numbers"
      )
    );
  }

  const pricing = await calculateRecommendedPackagePrice(
    existingPackage.itinerary || [],
    pricingVehicles,
    normalizedMarkup,
    normalizedInflation
  );

  if (
    !pricing ||
    !Number.isFinite(Number(pricing.finalCost))
  ) {
    throw new Error(
      "Recommended pricing calculation returned an invalid finalCost"
    );
  }

  existingPackage.recommendedPricing = pricing;
  existingPackage.basePrice = Number(pricing.finalCost);
  existingPackage.priceMarkup = normalizedMarkup;
  existingPackage.inflatedPercentage = normalizedInflation;


    // Save updated package
    const updatedPackage = await existingPackage.save();

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Pilgrimage Package updated successfully",
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

module.exports = { updatePilgrimagePackage: updatePilgrimage };
