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
    let { startDate, rooms, vehicle, hotels } = req.body;
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
    let packagePrice = 0;

    // Build hotel list based on user selection or defaults
    const hotelsToCheck = [];
    const selectedHotels = []; // Track what hotels were actually used

    for (const day of holidayPackages.itinerary) {
      if (!day.stay) continue;

      // Check if user wants to override hotel for this day
      const userSelectedHotelId =
        Array.isArray(hotels) && hotels.length > 0
          ? hotels.find((h) => h.dayNo === day.dayNo)?.hotel_id
          : null;

      if (userSelectedHotelId) {
        // Validate user's selection is in available hotels array
        const isValidHotel = day.hotels?.some((h) =>
          String(h.hotel_id) === String(userSelectedHotelId)
        );

        if (!isValidHotel) {
          return res.status(400).json(
            generateErrorResponse(
              "Bad Request",
              `Invalid hotel selection for day ${day.dayNo}. Hotel not available for this day.`
            )
          );
        }

        hotelsToCheck.push({
          dayNo: day.dayNo,
          hotel_id: userSelectedHotelId,
        });

        console.log(
          `✨ Day ${day.dayNo}: Using client-selected hotel: ${userSelectedHotelId}`
        );
      } else {
        // Use default hotel_id from package
        hotelsToCheck.push({
          dayNo: day.dayNo,
          hotel_id: day.hotel_id,
        });

        console.log(
          `ℹ️  Day ${day.dayNo}: Using default hotel: ${day.hotel_id}`
        );
      }
    }

    for (const h of hotelsToCheck) {
      try {
        const hotel = await hotelCollection.findById(
          h.hotel_id,
          "-__v -createdAt -updatedAt"
        );
        if (!hotel) {
          console.warn(`Hotel not found: ${h.hotel_id}`);
          continue;
        }

        // Track selected hotel
        selectedHotels.push({
          dayNo: h.dayNo,
          hotel_id: h.hotel_id,
          hotelName: hotel.hotelName,
          state: hotel.state,
          city: hotel.city,
        });

        // Check if hotel has rooms array
        if (!Array.isArray(hotel.rooms) || hotel.rooms.length === 0) {
          console.warn(
            `⚠️  Day ${h.dayNo}: Hotel "${hotel.hotelName}" has no rooms configured. Please add rooms to this hotel.`
          );
          return res
            .status(400)
            .json(
              generateErrorResponse(
                "Bad Request",
                `Hotel "${hotel.hotelName}" has no rooms configured. Please add rooms to this hotel and try again.`
              )
            );
        }

        for (const bookedRoom of rooms) {
          const { roomType, adults, children } = bookedRoom;

          const availableRoom = hotel.rooms.find((room) => {
            if (room.roomType === roomType) {
              return room.duration?.some((period) => {
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
            // adult pricing
            const adultRate =
              availableRoom.occupancyRates[
                Math.min(adults - 1, availableRoom.occupancyRates.length - 1)
              ] || 0;
            packagePrice += adultRate;

            // child pricing (if provided in schema)
            if (children) {
              if (children.withBed && availableRoom.child?.childWithBedPrice) {
                packagePrice +=
                  children.withBed * availableRoom.child.childWithBedPrice;
              }
              if (
                children.withoutBed &&
                availableRoom.child?.childWithoutBedPrice
              ) {
                packagePrice +=
                  children.withoutBed *
                  availableRoom.child.childWithoutBedPrice;
              }
            }

            console.log(
              `✅ Day ${h.dayNo}: Added ${adultRate} + children for ${roomType} in ${hotel.hotelName}`
            );
          } else {
            console.warn(
              `⚠️  Day ${h.dayNo}: No available ${roomType} room from ${startDate} to ${endDate} in hotel: ${hotel.hotelName}`
            );
            return res
              .status(400)
              .json(
                generateErrorResponse(
                  "Bad Request",
                  `No available ${roomType} room from ${startDate} to ${endDate} in hotel: ${hotel.hotelName}`
                )
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
      selectedHotels, // Show which hotels were used for pricing
    };

    console.log(
      `✅ Package pricing complete: ${packagePrice} (with ${selectedHotels.length} hotels)`
    );

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
