const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const moment = require("moment");

const holidayPackageDetails = async (req, res) => {
  try {
    let { startDate, adults, roomType, vehicle, hotels } = req.body;
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "Package ID is required"));
    }

    // Find holiday package
    let holidayPackages = await HolidayPackage.findById(
      id,
      "-__v -createdAt -updatedAt"
    );

    if (!holidayPackages) {
      return res
        .status(404)
        .json(generateErrorResponse("Not Found", "Holiday package not found"));
    }

    console.log("Holiday Package Found:", holidayPackages.packageDuration.days);

    // End date calculation
    let endDate = null;
    if (startDate) {
      const start = moment(startDate, "YYYY-MM-DD");
      if (!start.isValid()) {
        return res
          .status(400)
          .json(
            generateErrorResponse(
              "Bad Request",
              "Invalid startDate format. Use 'YYYY-MM-DD'."
            )
          );
      }
      endDate = start
        .clone()
        .add(holidayPackages.packageDuration.days, "days")
        .format("YYYY-MM-DD");
    }

    // Calculate package price
    // let packagePrice = 0;

    // for (const iti of holidayPackages.itinerary) {
    //   if (iti.stay && iti.hotel_id) {
    //     try {
    //       const hotel = await hotelCollection.findById(iti.hotel_id);

    //       if (!hotel) {
    //         console.warn(`Hotel not found for ID: ${iti.hotel_id}`);
    //         continue;
    //       }

    //       if (startDate && endDate) {
    //         const availableRoom = hotel.rooms.find((room) => {
    //           if (room.roomType === (roomType || "Standard")) {
    //             return room.duration.some((period) => {
    //               const hotelStartDate = new Date(period.startDate);
    //               const hotelEndDate = new Date(period.endDate);
    //               return (
    //                 new Date(startDate) >= hotelStartDate &&
    //                 new Date(endDate) <= hotelEndDate
    //               );
    //             });
    //           }
    //           return false;
    //         });

    //         if (availableRoom) {
    //           const rate =
    //             availableRoom.occupancyRates[
    //               Math.min(adults - 1, availableRoom.occupancyRates.length - 1)
    //             ] || 0;
    //           packagePrice += rate;
    //           console.log(
    //             `Added ${rate} for ${iti.dayNo} day stay in ${hotel.hotelName}`
    //           );
    //         } else {
    //           console.warn(
    //             `No available ${
    //               roomType || "Standard"
    //             } room from ${startDate} to ${endDate} in hotel: ${
    //               hotel.hotelName
    //             }`
    //           );
    //         }
    //       }
    //     } catch (error) {
    //       console.error(
    //         `Error processing hotel ${iti.hotel_id}:`,
    //         error.message
    //       );
    //     }
    //   }
    // }

    // Calculate package price
    let packagePrice = 0;

    // Decide which hotels to use: user provided or default itinerary
    const hotelsToCheck =
      Array.isArray(hotels) && hotels.length > 0
        ? hotels.map((h) => ({ hotel_id: h })) // normalize structure
        : holidayPackages.itinerary.filter((i) => i.stay && i.hotel_id);

    for (const h of hotelsToCheck) {
      try {
        const hotel = await hotelCollection.findById(
          h.hotel_id,
          "-__v -createdAt -updatedAt"
        );

        if (!hotel) {
          console.warn(`Hotel not found for ID: ${h.hotel_id}`);
          continue;
        }

        if (startDate && endDate) {
          const availableRoom = hotel.rooms.find((room) => {
            if (room.roomType === (roomType || "Standard")) {
              return room.duration.some((period) => {
                const hotelStartDate = new Date(period.startDate);
                const hotelEndDate = new Date(period.endDate);
                return (
                  new Date(startDate) >= hotelStartDate &&
                  new Date(endDate) <= hotelEndDate
                );
              });
            }
            return false;
          });

          if (availableRoom) {
            // Pick correct occupancy rate based on adults
            const rate =
              availableRoom.occupancyRates[
                Math.min(adults - 1, availableRoom.occupancyRates.length - 1)
              ] || 0;
            console.log(
              availableRoom.occupancyRates[0],
              Math.min(adults, availableRoom.occupancyRates.length - 1)
            );

            packagePrice += rate;
            console.log(`Added ${rate} for stay in ${hotel.hotelName}`);
          } else {
            console.warn(
              `No available ${
                roomType || "Standard"
              } room from ${startDate} to ${endDate} in hotel: ${
                hotel.hotelName
              }`
            );
          }
        }
      } catch (error) {
        console.error(`Error processing hotel ${h.hotel_id}:`, error.message);
      }
    }

    // Fetch vehicle options (fixed async issue with forEach)
    let vehicleOptions = [];
    if (
      Array.isArray(holidayPackages.vehiclePrices) &&
      holidayPackages.vehiclePrices.length > 0
    ) {
      vehicleOptions = await Promise.all(
        holidayPackages.vehiclePrices.map(async (element) => {
          const vehicleInfo = await vehicleCollection.findById(
            element.vehicle_id,
            "-__v -createdAt -updatedAt"
          );
          return vehicleInfo || null;
        })
      );
      vehicleOptions = vehicleOptions.filter(Boolean);
    }

    holidayPackages = holidayPackages.toObject();
    holidayPackages.vehicleOptions = vehicleOptions;

    // Add vehicle price
    if (vehicle) {
      const selectedVehicle = holidayPackages.vehiclePrices.find(
        (v) => String(v.vehicle_id) === String(vehicle)
      );
      if (selectedVehicle) {
        packagePrice += selectedVehicle.price;
      }
    } else if (
      Array.isArray(holidayPackages.vehiclePrices) &&
      holidayPackages.vehiclePrices.length > 0
    ) {
      packagePrice += holidayPackages.vehiclePrices.sort(
        (a, b) => a.price - b.price
      )[0].price;
    }

    // Apply markup and inflated percentage
    const priceMarkupPercent = holidayPackages.priceMarkup || 0;
    const inflatedPercent = holidayPackages.inflatedPercentage || 0;

    const priceMarkup = (packagePrice * priceMarkupPercent) / 100;
    const inflatedPercentage = (packagePrice * inflatedPercent) / 100;

    packagePrice = packagePrice + priceMarkup - inflatedPercentage;

    const responseData = {
      ...holidayPackages,
      packagePrice,
      inflatedPercentage,
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
    console.error("User Holiday Package Details Error:", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { holidayPackageDetails };
