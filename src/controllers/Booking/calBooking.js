const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const { vehicleCollection } = require("../../models/vehicle");

// ======================== INTERNAL FUNCTION ===========================
async function calculatePackageCostInternal(body) {
  try {
    const {
      // HOLIDAY PACKAGE + VEHICLE
      holidayPackageId,
      pilgrimagePackageId, // Support for pilgrimage packages
      vehicleId,

      // HOTEL INPUTS
      hotel_id,
      roomType,
      startDate,
      endDate,
      occupancy,
      childWithBed,
      childWithoutBed,

      // MARKUP
      priceMarkup = 0
    } = body;

    // Determine package ID (support both holiday and pilgrimage)
    const packageId = holidayPackageId || pilgrimagePackageId;
    let markup = priceMarkup;
    let days = 0;
    let hotelCost = 0;
    let vehicleFinal = 0;
    let basePackagePrice = 0;

    // 1️⃣ CALCULATE DAYS
    if (startDate && endDate) {
      days =
        (new Date(endDate) - new Date(startDate)) /
        (1000 * 60 * 60 * 24);

      if (days <= 0) {
        throw new Error("Invalid date range. End date must be after start date.");
      }
    }

    // 2️⃣ HOTEL COST
    if (hotel_id) {
      if (!roomType || !startDate || !endDate || !occupancy) {
        throw new Error("Hotel calculation requires roomType, startDate, endDate, occupancy.");
      }

      const hotel = await hotelCollection.findById(hotel_id);
      if (!hotel) throw new Error("Hotel not found");
     

      const normalize = (str) =>
        str.toLowerCase().replace(/[^a-z0-9]/g, "");

      const room = hotel.rooms.find(
        r => normalize(r.roomType) === normalize(roomType)
      );

      if (!room) throw new Error(`Room type ${roomType} not found in this hotel`);

      // Check room availability - if duration is configured, validate dates
      if (room.duration && room.duration.length > 0) {
        const available = room.duration.some((d) => {
          return (
            new Date(startDate) >= new Date(d.startDate) &&
            new Date(endDate) <= new Date(d.endDate)
          );
        });

        if (!available) {
          throw new Error("Room is not available for selected dates");
        }
      }

      const occupancyRate = room.occupancyRates[occupancy - 1];
      if (!occupancyRate) throw new Error("Invalid occupancy selected");

      let childTotal = 0;

      
      if (childWithBed == true) childTotal += room.child.childWithBedPrice;
      if (childWithoutBed == true) childTotal += room.child.childWithoutBedPrice;

      const perDayAmount = occupancyRate + childTotal;
      hotelCost = perDayAmount * days;
    }

    // 3️⃣ VEHICLE COST + BASE PACKAGE PRICE
    if (packageId && vehicleId) {
      // Try to find the package in either HolidayPackage or Pilgrimage collection
      let pkg = null;

      if (holidayPackageId) {
        pkg = await HolidayPackage.findById(holidayPackageId);
        if (!pkg) throw new Error("Holiday package not found");
      } else if (pilgrimagePackageId) {
        pkg = await Pilgrimage.findById(pilgrimagePackageId);
        if (!pkg) throw new Error("Pilgrimage package not found");
      }

      if (!pkg) throw new Error("Package not found");

      // Get base package price
      basePackagePrice = pkg.basePrice || 0;

      const vehicleData = pkg.availableVehicle.find(
        (v) => v.vehicle_id == vehicleId
      );

      if (!vehicleData) throw new Error("Vehicle not available in this package");

      const vehicle = await vehicleCollection.findById(vehicleId);

      if (!vehicle || !vehicle.active) {
        throw new Error("Selected vehicle is not active");
      }

      const baseVehiclePrice = vehicleData.price || vehicle.rate || 0;


      if (pkg.priceMarkup) {
        markup = pkg.priceMarkup;
      }

      const markupAmount = (baseVehiclePrice * markup) / 100;
      vehicleFinal = baseVehiclePrice + markupAmount;
    }

    // 4️⃣ FINAL PACKAGE PRICE = Base Package Price + Hotel Cost + Vehicle Cost
    const finalPackage = basePackagePrice + hotelCost + vehicleFinal;

    // Calculate per day amount for display purposes
    let perDayAmount = undefined;
    if (hotel_id && days > 0) {
      perDayAmount = hotelCost / days;
    }

    console.log({ finalPackage, basePackagePrice, days, hotelCost, vehicleFinal, markup, perDayAmount });
    return {
      success: true,
      finalPackage,
      breakdown: {
        days,
        basePackagePrice,
        hotelCost,
        vehicleFinal,
        perDayAmount,
        markup,
        hotelPriceFound: hotelCost > 0,
        vehiclePriceFound: vehicleFinal > 0
      }
    };

  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ======================== API CONTROLLER ===========================
exports.calculatePackageCost = async (req, res) => {
  const result = await calculatePackageCostInternal(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json({
    success: true,
    message: "Package cost calculated successfully",
    ...result
  });
};

// Export internal function for use inside createBooking
exports.calculatePackageCostInternal = calculatePackageCostInternal;
