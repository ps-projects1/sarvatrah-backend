const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const moment = require("moment");

const holidayPackageDetails = async (req, res) => {
  try {
    let date = new Date();
    date = moment(date).format("YYYY-MM-DD");

    const { id } = req.params;

    // Validate id
    if (!id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "Package ID is required"));
    }

    // Find the holiday package by ID
    let holidayPackages = await HolidayPackage.findById(
      id,
      "-__v -createdAt -updatedAt"
    );

    if (!holidayPackages) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "Holiday package not found"));
    }

    let packagePrice = 0;

    for (let iti of holidayPackages.itinerary) {
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

    if (
      Array.isArray(holidayPackages.vehiclePrices) &&
      holidayPackages.vehiclePrices.length > 0
    ) {
      packagePrice += holidayPackages.vehiclePrices.sort(
        (a, b) => a.price - b.price
      )[0].price;
    }

    let priceMarkup = holidayPackages.priceMarkup || 0;
    let inflatedPercentage = holidayPackages.inflatedPercentage || 0;

    priceMarkup = (packagePrice * priceMarkup) / 100;
    inflatedPercentage = (packagePrice * inflatedPercentage) / 100;

    packagePrice = packagePrice + priceMarkup - inflatedPercentage;

    holidayPackages = JSON.parse(JSON.stringify(holidayPackages));
    const responseData = {
      ...holidayPackages,
      packagePrice: packagePrice,
      inflatedPercentage: inflatedPercentage,
    };

    return res
      .status(200)
      .json(
        generateResponse(
          true,
          "Holiday package details retrieved successfully",
          responseData
        )
      );
  } catch (error) {
    console.log("User Holiday Package Details Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { holidayPackageDetails };
