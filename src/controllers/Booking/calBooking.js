const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { vehicleCollection } = require("../../models/vehicle"); // Correct import

exports.calculatePackageCost = async (req, res) => {
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
    } = req.body;

    let days = 0;
    let hotelCost = 0;
    let vehicleFinal = 0;

    // ======================= 1️⃣ CALCULATE DAYS ==========================
    if (startDate && endDate) {
      days =
        (new Date(endDate) - new Date(startDate)) /
        (1000 * 60 * 60 * 24);

      if (days <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid date range. End date must be after start date."
        });
      }
    }

    // ======================= 2️⃣ HOTEL COST ==============================
    if (hotel_id) {
      if (!roomType || !startDate || !endDate || !occupancy) {
        return res.status(400).json({
          success: false,
          message:
            "Hotel calculation requires roomType, startDate, endDate, occupancy"
        });
      }

      const hotel = await hotelCollection.findById(hotel_id);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found"
        });
      }

      const room = hotel.rooms.find((r) => r.roomType === roomType);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: `Room type ${roomType} not found in this hotel`
        });
      }

      const available = room.duration.some((d) => {
        return (
          new Date(startDate) >= new Date(d.startDate) &&
          new Date(endDate) <= new Date(d.endDate)
        );
      });

      if (!available) {
        return res.status(400).json({
          success: false,
          message: "Room is not available for selected dates"
        });
      }

      const occupancyRate = room.occupancyRates[occupancy - 1];
      if (!occupancyRate) {
        return res.status(400).json({
          success: false,
          message: "Invalid occupancy selected"
        });
      }

      let childTotal = 0;

      if (childWithBed === true) childTotal += room.child.childWithBedPrice;
      if (childWithoutBed === true) childTotal += room.child.childWithoutBedPrice;

      const perDayAmount = occupancyRate + childTotal;
      hotelCost = perDayAmount * days;
    }

    // ======================= 3️⃣ VEHICLE COST =============================
    if (holidayPackageId && vehicleId) {
      const holidayPkg = await HolidayPackage.findById(holidayPackageId);

      if (!holidayPkg) {
        return res.status(404).json({
          success: false,
          message: "Holiday package not found"
        });
      }

      // Fetch vehicle price from holiday package.allowedVehicles
      const vehicleData = holidayPkg.availableVehicle.find(
        (v) => v.vehicle_id == vehicleId
      );

      if (!vehicleData) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not available in this holiday package"
        });
      }

      // Check if vehicle active from vehicle collection
      const vehicle = await vehicleCollection.findById(vehicleId);

      if (!vehicle || !vehicle.active) {
        return res.status(400).json({
          success: false,
          message: "Selected vehicle is not active"
        });
      }

      // Priority: holiday package price → vehicle.rate → 0
      const baseVehiclePrice = vehicleData.price || vehicle.rate || 0;

      if (holidayPkg.priceMarkup) {
        priceMarkup = holidayPkg.priceMarkup;
      }

      const markupAmount = (baseVehiclePrice * priceMarkup) / 100;
      vehicleFinal = baseVehiclePrice + markupAmount;
    }

    // ======================= 4️⃣ FINAL PACKAGE COST =======================
    const finalPackage = hotelCost + vehicleFinal;

    return res.json({
      success: true,
      message: "Package cost calculated successfully",
      finalPackage,
      breakdown: {
        days,
        hotelCost,
        vehicleFinal,
        priceMarkup,
        hotelPriceFound: hotelCost > 0,
        vehiclePriceFound: vehicleFinal > 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
