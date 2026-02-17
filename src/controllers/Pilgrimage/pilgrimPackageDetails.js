const {
  generateErrorResponse,
  generateResponse,
} = require("../../helper/response");
const { Pilgrimage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const moment = require("moment");

const pilgrimagePackageDetails = async (req, res) => {
  try {
    let { startDate, rooms, vehicle, hotels } = req.body;
    const { id } = req.params;

    // Log incoming request data for debugging
    console.log(`📥 [pilgrimagePackageDetails] Request received:`);
    console.log(`   - startDate: ${startDate}`);
    console.log(`   - rooms type: ${typeof rooms}, isArray: ${Array.isArray(rooms)}`);
    console.log(`   - rooms value:`, rooms);
    console.log(`   - vehicle: ${vehicle}`);
    console.log(`   - hotels type: ${typeof hotels}, isArray: ${Array.isArray(hotels)}`);
    console.log(`   - hotels value:`, hotels);

    // Parse rooms if it's a string (from FormData)
    if (typeof rooms === 'string') {
      console.log(`⚠️  Rooms is a string, parsing JSON...`);
      try {
        rooms = JSON.parse(rooms);
        console.log(`✅ Rooms parsed successfully:`, rooms);
      } catch (parseError) {
        console.error(`❌ Failed to parse rooms JSON:`, parseError.message);
        return res.status(400).json(
          generateErrorResponse(
            "Bad Request",
            `Invalid rooms format. Expected JSON array: ${parseError.message}`
          )
        );
      }
    }

    // Validate ID
    if (!id) {
      return res
        .status(400)
        .json(generateErrorResponse("Bad Request", "Package ID is required"));
    }

    // Find holiday package
    let pilgrimagePackages = await Pilgrimage.findById(
      id,
      "-__v -createdAt -updatedAt"
    );

    if (!pilgrimagePackages) {
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
        .add(pilgrimagePackages.packageDuration.days, "days")
        .format("YYYY-MM-DD");
    }

    // Calculate package price
    let packagePrice = 0;

    // Build hotel list based on user selection or defaults
    const hotelsToCheck = [];
    const selectedHotels = []; // Track what hotels were actually used

    for (const day of pilgrimagePackages.itinerary) {
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

    // Validate rooms parameter before processing hotels
    console.log(`📋 Before hotel processing - rooms validation:`, {
      roomsExists: rooms !== undefined && rooms !== null,
      roomsIsArray: Array.isArray(rooms),
      roomsLength: Array.isArray(rooms) ? rooms.length : 'N/A',
      roomsType: typeof rooms
    });

    // ⚠️ Check if rooms is provided - if not, skip room processing
    let hasRooms = rooms && Array.isArray(rooms) && rooms.length > 0;

    if (rooms && !Array.isArray(rooms)) {
      console.error(
        `❌ Invalid rooms parameter. Expected array but got ${typeof rooms}:`,
        rooms
      );
      return res.status(400).json(
        generateErrorResponse(
          "Bad Request",
          `Invalid rooms format. Expected array of room bookings. Got ${typeof rooms}.`
        )
      );
    }

    if (!hasRooms) {
      console.log(`ℹ️  No rooms specified in request. Skipping room pricing calculation. Returning available hotels for selection.`);
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
        console.log(
          `🔍 Day ${h.dayNo}: Checking rooms for hotel "${hotel.hotelName}":`,
          `Type: ${typeof hotel.rooms}, isArray: ${Array.isArray(hotel.rooms)}, Value:`,
          hotel.rooms
        );

        // Handle case where rooms might be stored as object instead of array
        let hotelRooms = hotel.rooms;
        if (typeof hotelRooms === 'object' && !Array.isArray(hotelRooms)) {
          // If rooms is an object with room data, try to convert it to array
          if (hotelRooms && Object.keys(hotelRooms).length > 0) {
            hotelRooms = Object.values(hotelRooms);
            console.warn(
              `⚠️  Day ${h.dayNo}: Converted rooms from object to array`
            );
          } else {
            hotelRooms = [];
          }
        }

        if (!Array.isArray(hotelRooms) || hotelRooms.length === 0) {
          console.warn(
            `⚠️  Day ${h.dayNo}: Hotel "${hotel.hotelName}" has no rooms configured. Please add rooms to this hotel.`
          );
          // If rooms are provided by client, reject the request
          if (hasRooms) {
            return res
              .status(400)
              .json(
                generateErrorResponse(
                  "Bad Request",
                  `Hotel "${hotel.hotelName}" has no rooms configured. Please add rooms to this hotel and try again.`
                )
              );
          }
          // If no rooms provided, just skip pricing for this hotel
          continue;
        }

        // Only process room pricing if rooms were provided by client
        if (!hasRooms) {
          console.log(`ℹ️  Day ${h.dayNo}: Skipping room pricing (no rooms specified). Hotel available for selection.`);
          continue;
        }

        for (const bookedRoom of rooms) {
          const { roomType, adults, children } = bookedRoom;

          const availableRoom = hotelRooms.find((room) => {
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
      Array.isArray(pilgrimagePackages.vehiclePrices) &&
      pilgrimagePackages.vehiclePrices.length > 0
    ) {
      vehicleOptions = await Promise.all(
        pilgrimagePackages.vehiclePrices.map(async (element) => {
          const vehicleInfo = await vehicleCollection.findById(
            element.vehicle_id,
            "-__v -createdAt -updatedAt"
          );
          return vehicleInfo || null;
        })
      );
      vehicleOptions = vehicleOptions.filter(Boolean);
    }

    pilgrimagePackages = pilgrimagePackages.toObject();
    pilgrimagePackages.vehicleOptions = vehicleOptions;

    // Add vehicle price
    if (vehicle) {
      const selectedVehicle = pilgrimagePackages.vehiclePrices.find(
        (v) => String(v.vehicle_id) === String(vehicle)
      );
      if (selectedVehicle) {
        packagePrice += selectedVehicle.price;
      }
    } else if (
      Array.isArray(pilgrimagePackages.vehiclePrices) &&
      pilgrimagePackages.vehiclePrices.length > 0
    ) {
      packagePrice += pilgrimagePackages.vehiclePrices.sort(
        (a, b) => a.price - b.price
      )[0].price;
    }

    // Apply markup and inflated percentage
    const priceMarkupPercent = pilgrimagePackages.priceMarkup || 0;
    const inflatedPercent = pilgrimagePackages.inflatedPercentage || 0;

    const priceMarkup = (packagePrice * priceMarkupPercent) / 100;
    const inflatedPercentage = (packagePrice * inflatedPercent) / 100;

    packagePrice = packagePrice + priceMarkup - inflatedPercentage;

    const responseData = {
      ...pilgrimagePackages,
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

module.exports = { pilgrimagePackageDetails };
