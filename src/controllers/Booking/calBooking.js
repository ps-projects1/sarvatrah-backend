const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { vehicleCollection } = require("../../models/vehicle");

// ======================== INTERNAL FUNCTION ===========================
async function calculatePackageCostInternal(body) {
  try {
    const {
      // HOLIDAY PACKAGE + VEHICLE
      holidayPackageId,
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
    let markup = priceMarkup;
    let days = 0;
    let hotelCost = 0;
    let vehicleFinal = 0;

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

      const available = room.duration.some((d) => {
        return (
          new Date(startDate) >= new Date(d.startDate) &&
          new Date(endDate) <= new Date(d.endDate)
        );
      });

      if (!available) throw new Error("Room is not available for selected dates");

      const occupancyRate = room.occupancyRates[occupancy - 1];
      if (!occupancyRate) throw new Error("Invalid occupancy selected");

      let childTotal = 0;

      
      if (childWithBed == true) childTotal += room.child.childWithBedPrice;
      if (childWithoutBed == true) childTotal += room.child.childWithoutBedPrice;

      const perDayAmount = occupancyRate + childTotal;
      hotelCost = perDayAmount * days;
    }

    // 3️⃣ VEHICLE COST
    if (holidayPackageId && vehicleId) {
      const holidayPkg = await HolidayPackage.findById(holidayPackageId);
      if (!holidayPkg) throw new Error("Holiday package not found");

      const vehicleData = holidayPkg.availableVehicle.find(
        (v) => v.vehicle_id == vehicleId
      );

      if (!vehicleData) throw new Error("Vehicle not available in this holiday package");

      const vehicle = await vehicleCollection.findById(vehicleId);

      if (!vehicle || !vehicle.active) {
        throw new Error("Selected vehicle is not active");
      }

      const baseVehiclePrice = vehicleData.price || vehicle.rate || 0;

      
      if (holidayPkg.priceMarkup) {
        markup = holidayPkg.priceMarkup;
      }

      const markupAmount = (baseVehiclePrice * markup) / 100;
      vehicleFinal = baseVehiclePrice + markupAmount;
    }

    const finalPackage = hotelCost + vehicleFinal;
    console.log({ finalPackage, days, hotelCost, vehicleFinal ,markup});
    return {
      success: true,
      finalPackage,
      breakdown: {
        days,
        hotelCost,
        vehicleFinal,
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
