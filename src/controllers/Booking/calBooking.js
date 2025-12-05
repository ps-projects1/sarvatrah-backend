/**
 * Calculate Complete Package Cost
 *
 * Inputs from frontend:
 * - hotel_id
 * - roomType
 * - startDate, endDate
 * - occupancy (1,2,3...)
 * - childWithBed (true/false)
 * - childWithoutBed (true/false)
 * - vehicleCost
 * - priceMarkup (%)
 *
 * Everything else (child price, occupancy price, durations)
 * will be fetched from DATABASE.
 */


const { hotelCollection } = require("../../models/hotel");


exports.calculatePackageCost = async (req, res) => {
  try {
    const {
      hotel_id,
      roomType,
      startDate,
      endDate,
      occupancy,
      childWithBed,     // boolean
      childWithoutBed,  // boolean
      vehicleCost,
      priceMarkup
    } = req.body;

    // -----------------------------------------------------------
    // 1️⃣ Calculate number of days between start → end
    // -----------------------------------------------------------
    const days =
      (new Date(endDate) - new Date(startDate)) /
      (1000 * 60 * 60 * 24); // convert ms → days

    if (days <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range. End date must be after start date.",
      });
    }

    // -----------------------------------------------------------
    // 2️⃣ Fetch Hotel From Database
    // -----------------------------------------------------------
    const hotel = await hotelCollection.findById(hotel_id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found using given hotel_id",
      });
    }

    // -----------------------------------------------------------
    // 3️⃣ Find Room Type Inside the Hotel
    // -----------------------------------------------------------
    // The hotel may contain multiple rooms, so we filter by roomType
    const room = hotel.rooms.find((r) => r.roomType === roomType);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room type ${roomType} not found in this hotel`,
      });
    }

    // -----------------------------------------------------------
    // 4️⃣ Check if Selected Dates Fall Within Available Duration
    // -----------------------------------------------------------
    // Each room has multiple duration ranges, so we check all
    const available = room.duration.some((d) => {
      return (
        new Date(startDate) >= new Date(d.startDate) &&
        new Date(endDate) <= new Date(d.endDate)
      );
    });

    if (!available) {
      return res.status(400).json({
        success: false,
        message: "Room is not available for the selected dates",
      });
    }

    // -----------------------------------------------------------
    // 5️⃣ Occupancy Price Based on Selected Occupancy
    // -----------------------------------------------------------
    // occupancyRates = [2000, 4000, 5000]
    // occupancy 1 → index 0
    // occupancy 2 → index 1
    // occupancy 3 → index 2
    const occupancyRate = room.occupancyRates[occupancy - 1];

    if (!occupancyRate) {
      return res.status(400).json({
        success: false,
        message: "Invalid occupancy selected. Not available in this room.",
      });
    }

    // -----------------------------------------------------------
    // 6️⃣ Calculate Child Price (Using TRUE / FALSE input)
    // -----------------------------------------------------------
    // Child prices come from DB, user only selects true/false
    let childTotal = 0;

    if (childWithBed === true) {
      childTotal += room.child.childWithBedPrice;
    }

    if (childWithoutBed === true) {
      childTotal += room.child.childWithoutBedPrice;
    }

    // -----------------------------------------------------------
    // 7️⃣ Calculate Per Day Room Cost
    // -----------------------------------------------------------
    // per-day = occupancy rate + child prices
    const perDayAmount = occupancyRate + childTotal;

    // -----------------------------------------------------------
    // 8️⃣ Calculate Total Hotel Cost for Selected Days
    // -----------------------------------------------------------
    const hotelCost = perDayAmount * days;

    // -----------------------------------------------------------
    // 9️⃣ Calculate Vehicle Cost With Markup Percentage
    // -----------------------------------------------------------
    // markupAmount = vehicleCost × (markup / 100)
    const vehicleMarkupAmount = (vehicleCost * priceMarkup) / 100;
    const vehicleFinal = vehicleCost + vehicleMarkupAmount;

    // -----------------------------------------------------------
    // 🔟 Final Package Amount
    // -----------------------------------------------------------
    const finalPackage = hotelCost + vehicleFinal;

    // -----------------------------------------------------------
    // 📤 Return Full Breakdown to Frontend
    // -----------------------------------------------------------
    return res.json({
      success: true,
      message: "Package cost calculated successfully",
      days,
      finalPackage,
      breakdown: {
        occupancyRate,      // price per occupancy
        childTotal,         // total child charges
        perDayAmount,       // hotel cost per day
        hotelCost,          // hotel × days
        vehicleFinal,       // vehicle + markup
      },
    });

  } catch (error) {
    // ERROR HANDLER
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
