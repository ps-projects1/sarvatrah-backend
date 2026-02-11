const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { PilgrimagePackage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const moment = require("moment");

const userPilgrimagePackageList = async (req, res) => {
  try {
    let date = new Date();
    date = moment(date).format("YYYY-MM-DD");
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const { packageType, nights } = req.query;

    // Build the filter object
    const filter = {};

    // Add theme filter if provided
    if (packageType) {
      filter.packageType = packageType;
    }

    // Add duration filter if provided
    if (nights) {
      const nightsNum = parseInt(nights);
      if (!isNaN(nightsNum)) {
        if (nights.startsWith("<")) {
          filter["packageDuration.nights"] = { $lt: nightsNum };
        } else if (nights.startsWith(">")) {
          filter["packageDuration.nights"] = { $gt: nightsNum };
        } else if (nights.includes("-")) {
          const [minNights, maxNights] = nights.split("-").map(Number);
          filter["packageDuration.nights"] = {
            $gte: minNights,
            $lte: maxNights,
          };
        } else {
          filter["packageDuration.nights"] = nightsNum;
        }
      }
    }

    // Get total count of documents for pagination info
    const totalPilgrimagePackages = await PilgrimagePackage.countDocuments(filter);

    // Find holiday packages with pagination and filters
    let pilgrimagePackages = await PilgrimagePackage.find(
      filter,
      "-__v -createdAt -updatedAt"
    )
      .skip(skip)
      .limit(limit);

    if (!pilgrimagePackages || pilgrimagePackages.length === 0) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "No holiday packages found"));
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalPilgrimagePackages / limit);
    let packagePrice = 0;
    for (let pkg of pilgrimagePackages) {
      for (let iti of pkg.itinerary) {
        if (iti.stay && iti.hotel_id) {
          try {
            const hotel = await hotelCollection.findById(iti.hotel_id);

            if (!hotel) {
              console.warn(`Hotel not found for ID: ${iti.hotel_id}`);
              continue;
            }

            if (date) {
              // Convert input date to Date object for comparison
              const searchDate = new Date(date);

              const availableRoom = hotel.rooms.find((room) => {
                if (room.roomType == "Standard") {
                  // Check if room is available for the given date
                  return room.duration.some((period) => {
                    const startDate = new Date(period.startDate);
                    const endDate = new Date(period.endDate);
                    return searchDate >= startDate && searchDate <= endDate;
                  });
                }
                return false;
              });

              if (availableRoom) {
                // Use appropriate occupancy rate based on number of people
                // Assuming you want the rate for 1 person (index 0)
                packagePrice += availableRoom.occupancyRates[0];
                console.log(
                  `Added ${availableRoom.occupancyRates[0]} for ${iti.dayNo} day stay`
                );
              } else {
                console.warn(
                  `No available Standard room for date: ${date} in hotel: ${hotel.hotelName}`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error processing hotel ${iti.hotel_id}:`,
              error.message
            );
          }
        }
      }
    }

    if (
      Array.isArray(pilgrimagePackages[0].vehiclePrices) &&
      pilgrimagePackages[0].vehiclePrices.length > 0
    ) {
      packagePrice += pilgrimagePackages[0].vehiclePrices.sort(
        (a, b) => a.price - b.price
      )[0].price;
    }

    let priceMarkup = pilgrimagePackages[0].priceMarkup || 0;
    let inflatedPercentage = pilgrimagePackages[0].inflatedPercentage || 0;

    priceMarkup = (packagePrice * priceMarkup) / 100;
    inflatedPercentage = (packagePrice * inflatedPercentage) / 100;

    packagePrice = packagePrice + priceMarkup - inflatedPercentage;

    pilgrimagePackages = JSON.parse(JSON.stringify(pilgrimagePackages));
    pilgrimagePackages.forEach((pkg) => {
      pkg.packagePrice = packagePrice;
    });

    // Response data with pagination info
    const responseData = {
      pilgrimagePackages: pilgrimagePackages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalPilgrimagePackages,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      // packagePrice: packagePrice,
      // priceMarkup: priceMarkup,
      // inflatedPercentage: inflatedPercentage,
    };

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "User holiday packages retrieved successfully",
          responseData
        )
      );
  } catch (error) {
    console.log("User Holiday Package List", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { userPilgrimagePackageList };
