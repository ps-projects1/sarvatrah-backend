const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { PilgrimagePackage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const Joi = require("joi");
const uploadToSupabase = require("../../utils/uploadToSupabase");

const updatePilgrimagePackage = async (req, res) => {
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
    const existingPackage = await PilgrimagePackage.findById(_id);
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

    // Validate hotel selections from itinerary if provided
    if (parsedItinerary && Array.isArray(parsedItinerary)) {
      for (const item of parsedItinerary) {
        if (item.stay && item.hotel_id) {
          const hotel = await hotelCollection.findById(item.hotel_id);

          if (!hotel) {
            return res.status(400).json(
              generateErrorResponse(
                "Validation Error",
                `Hotel not found for day ${item.dayNo}. Please select a valid hotel.`
              )
            );
          }

          if (!hotel.active) {
            return res.status(400).json(
              generateErrorResponse(
                "Validation Error",
                `Hotel "${hotel.hotelName}" is inactive for day ${item.dayNo}. Please select an active hotel.`
              )
            );
          }

          // Validate location match if state and city are provided
          if (item.state && item.city) {
            const itemState = typeof item.state === 'object' ? item.state.name : item.state;
            const itemCity = typeof item.city === 'object' ? item.city.name : item.city;
            
            if (hotel.state !== itemState || hotel.city !== itemCity) {
              return res.status(400).json(
                generateErrorResponse(
                  "Validation Error",
                  `Hotel location (${hotel.state}, ${hotel.city}) doesn't match day ${item.dayNo} location (${itemState}, ${itemCity}). Please select a hotel from the correct location.`
                )
              );
            }
          }

          console.log(
            `✅ Day ${item.dayNo}: Validated hotel: ${hotel.hotelName} (${hotel._id})`
          );
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
    if (basePrice !== undefined) existingPackage.basePrice = parseFloat(basePrice);
    if (priceMarkup !== undefined) existingPackage.priceMarkup = parseFloat(priceMarkup);
    if (inflatedPercentage !== undefined) existingPackage.inflatedPercentage = parseFloat(inflatedPercentage);
    if (active !== undefined) existingPackage.active = active === "true" || active === true;
    if (startCity !== undefined) existingPackage.startCity = startCity;
    if (parsedItinerary !== undefined) existingPackage.itinerary = parsedItinerary;
    if (parsedVehicles !== undefined) existingPackage.vehiclePrices = parsedVehicles;

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

module.exports = { updatePilgrimagePackage };
