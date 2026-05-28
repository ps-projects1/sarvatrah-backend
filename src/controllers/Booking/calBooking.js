const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const { vehicleCollection } = require("../../models/vehicle");

// ======================== INTERNAL FUNCTION ===========================
async function calculatePackageCostInternal(body) {

  try {

    const {

      // PACKAGE
      holidayPackageId,
      pilgrimagePackageId,

      // VEHICLE
      vehicleId,

      // HOTELS
      selectedHotels = [],

      // DATE
      startDate,
      endDate,

      // TRAVELLERS
      totalTraveller = 1,

      // CHILD
      childWithBed = false,
      childWithoutBed = false,

      // MARKUP
      priceMarkup = 0,

    } = body;

    // ========================
    // PACKAGE VALIDATION
    // ========================

    const packageId =
      holidayPackageId ||
      pilgrimagePackageId;

    if (!packageId) {

      throw new Error(
        "Package ID is required"
      );
    }

    // ========================
    // GET PACKAGE
    // ========================

    let pkg = null;

    if (holidayPackageId) {

      pkg =
        await HolidayPackage.findById(
          holidayPackageId
        );

    } else {

      pkg =
        await Pilgrimage.findById(
          pilgrimagePackageId
        );
    }

    if (!pkg) {

      throw new Error(
        "Package not found"
      );
    }

    // ========================
    // DATE VALIDATION
    // ========================

    const bookingStart =
      new Date(startDate);

    const bookingEnd =
      new Date(endDate);

    if (
      isNaN(bookingStart) ||
      isNaN(bookingEnd)
    ) {

      throw new Error(
        "Invalid booking dates"
      );
    }

    const days = Math.ceil(
      (bookingEnd - bookingStart) /
      (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {

      throw new Error(
        "End date must be after start date"
      );
    }

    // ========================
    // BASE PACKAGE PRICE
    // ========================

    const basePackagePrice =
      pkg.basePrice || 0;

    // ========================
    // HOTEL CALCULATION
    // ========================

    let hotelCost = 0;

    const normalize = (
      str = ""
    ) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    for (const selectedHotel of selectedHotels) {

      const {

        dayNo,

        hotelId,

        roomType,

        occupancy,

        nights = 1,

      } = selectedHotel;

      // ========================
      // FETCH HOTEL
      // ========================

      const hotel =
        await hotelCollection.findById(
          hotelId
        );

      if (!hotel) {

        throw new Error(
          `Hotel not found for day ${dayNo}`
        );
      }

      if (!hotel.active) {

        throw new Error(
          `${hotel.hotelName} is inactive`
        );
      }

      // ========================
      // HOTEL BLACKOUT
      // ========================

      if (
        hotel.blackout?.start &&
        hotel.blackout?.end
      ) {

        const blackoutStart =
          new Date(
            hotel.blackout.start
          );

        const blackoutEnd =
          new Date(
            hotel.blackout.end
          );

        if (
          bookingStart <= blackoutEnd &&
          bookingEnd >= blackoutStart
        ) {

          throw new Error(
            `${hotel.hotelName} unavailable due to blackout`
          );
        }
      }

      // ========================
      // FIND ROOM
      // ========================

      const room =
        hotel.rooms.find(
          (r) =>
            normalize(r.roomType) ===
            normalize(roomType)
        );

      if (!room) {

        throw new Error(
          `${roomType} room not found in ${hotel.hotelName}`
        );
      }

      // ========================
      // ROOM AVAILABILITY
      // ========================

      let roomAvailable = false;

      for (const duration of room.duration) {

        const roomStart =
          new Date(duration.startDate);

        const roomEnd =
          new Date(duration.endDate);

        if (
          bookingStart >= roomStart &&
          bookingEnd <= roomEnd
        ) {

          roomAvailable = true;

          break;
        }
      }

      if (!roomAvailable) {

        throw new Error(
          `${roomType} unavailable in ${hotel.hotelName} for selected dates`
        );
      }

      // ========================
      // INVENTORY CHECK
      // ========================

      if (
        room.inventory <
        Number(totalTraveller)
      ) {

        throw new Error(
          `Insufficient inventory in ${hotel.hotelName}`
        );
      }

      // ========================
      // OCCUPANCY PRICE
      // ========================

      const occupancyIndex =
        Number(occupancy) - 1;

      const occupancyRate =
        room.occupancyRates[
          occupancyIndex
        ];

      if (
        occupancyRate === undefined
      ) {

        throw new Error(
          `Invalid occupancy selected in ${hotel.hotelName}`
        );
      }

      // ========================
      // CHILD PRICING
      // ========================

      let childTotal = 0;

      if (childWithBed) {

        childTotal +=
          room.child
            ?.childWithBedPrice || 0;
      }

      if (childWithoutBed) {

        childTotal +=
          room.child
            ?.childWithoutBedPrice || 0;
      }

      // ========================
      // FINAL ROOM PRICE
      // ========================

      const perNightRoomPrice =
        occupancyRate + childTotal;

      const totalRoomPrice =
        perNightRoomPrice *
        Number(nights);

      hotelCost += totalRoomPrice;
    }

    // ========================
    // VEHICLE CALCULATION
    // ========================

    let vehicleFinal = 0;

    let markup =
      Number(priceMarkup) || 0;

    if (vehicleId) {

      const vehicleData =
        pkg.availableVehicle?.find(
          (v) =>
            String(v.vehicle_id) ===
            String(vehicleId)
        ) ||

        pkg.vehiclePrices?.find(
          (v) =>
            String(v.vehicle_id) ===
            String(vehicleId)
        );

      if (!vehicleData) {

        throw new Error(
          "Vehicle not available in this package"
        );
      }

      const vehicle =
        await vehicleCollection.findById(
          vehicleId
        );

      if (!vehicle) {

        throw new Error(
          "Vehicle not found"
        );
      }

      if (!vehicle.active) {

        throw new Error(
          "Selected vehicle inactive"
        );
      }

      // ========================
      // VEHICLE BLACKOUT
      // ========================

      if (
        vehicle.blackout?.start &&
        vehicle.blackout?.end
      ) {

        const blackoutStart =
          new Date(
            vehicle.blackout.start
          );

        const blackoutEnd =
          new Date(
            vehicle.blackout.end
          );

        if (
          bookingStart <= blackoutEnd &&
          bookingEnd >= blackoutStart
        ) {

          throw new Error(
            "Vehicle unavailable due to blackout"
          );
        }
      }

      // ========================
      // VEHICLE PRICE
      // ========================

      const baseVehiclePrice =
        vehicleData.price ||
        vehicle.rate ||
        0;

      if (pkg.priceMarkup) {

        markup =
          Number(pkg.priceMarkup);
      }

      const markupAmount =
        (baseVehiclePrice * markup) /
        100;

      vehicleFinal =
        baseVehiclePrice +
        markupAmount;
    }

    // ========================
    // FINAL CALCULATION
    // ========================

    const travellerBasePrice =
      basePackagePrice *
      Number(totalTraveller);

    const finalPackage =
      travellerBasePrice +
      hotelCost +
      vehicleFinal;

    // ========================
    // RESPONSE
    // ========================

    return {

      success: true,

      finalPackage,

      breakdown: {

        days,

        totalTraveller,

        basePackagePrice,

        hotelCost,

        vehicleFinal,

        markup,

        hotelPriceFound:
          hotelCost > 0,

        vehiclePriceFound:
          vehicleFinal > 0,
      },
    };

  } catch (err) {

    return {

      success: false,

      message: err.message,
    };
  }
}

// ======================== API CONTROLLER ===========================

exports.calculatePackageCost =
  async (req, res) => {

    const result =
      await calculatePackageCostInternal(
        req.body
      );

    if (!result.success) {

      return res.status(400).json(
        result
      );
    }

    return res.json({

      success: true,

      message:
        "Package cost calculated successfully",

      ...result,
    });
  };

// ======================== EXPORT ===========================

exports.calculatePackageCostInternal =
  calculatePackageCostInternal;