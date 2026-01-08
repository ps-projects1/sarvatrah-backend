const Booking = require("../../models/booking");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");
const { calculatePackageCostInternal } = require("./calBooking");

const createBooking = async (req, res) => {
  try {
    // 🔐 Always take user from token
    const userId = req.user._id;

    const {
      startDate,
      endDate,
      totalPrice,           // OLD FLOW SWITCH
      totalTraveller,
      vehicleId,
      hotelId,
      packageId,
      travellers,
      billingInfo,

      // NEW FLOW FIELDS
      roomType,
      occupancy,
      childWithBed,
      childWithoutBed,
      priceMarkup
    } = req.body;

    /* =====================
       BASIC VALIDATION
    ===================== */
    if (
      !startDate || !endDate ||
      !totalTraveller || !vehicleId ||
      !hotelId || !packageId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields."
      });
    }

    /* =====================
       USER VALIDATION
    ===================== */
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found." });

    if (user.userRole !== 0)
      return res.status(403).json({ message: "Only users can book." });

    /* =====================
       REFERENCE VALIDATION
    ===================== */
    const holidayPackage = await HolidayPackage.findById(packageId);
    if (!holidayPackage)
      return res.status(404).json({ message: "Holiday package not found." });

    const vehicle = await vehicleCollection.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    const hotel = await hotelCollection.findById(hotelId);
    if (!hotel)
      return res.status(404).json({ message: "Hotel not found." });

    /* =====================
       TRAVELLER VALIDATION
    ===================== */
    if (!Array.isArray(travellers) || travellers.length === 0) {
      return res.status(400).json({
        message: "Travellers data is required."
      });
    }

    if (travellers.filter(t => t.isLeadTraveller).length !== 1) {
      return res.status(400).json({
        message: "There must be exactly one lead traveller."
      });
    }

    if (travellers.length !== Number(totalTraveller)) {
      return res.status(400).json({
        message: "Total travellers count mismatch."
      });
    }

    /* =====================================================
       OLD VERSION — CLIENT PROVIDED PRICE
       (Allowed by business decision)
    ===================================================== */
    if (totalPrice) {
      const booking = new Booking({
        user: userId,
        holidayPackageId: packageId,
        vehicleId,
        hotelId,
        startDate,
        endDate,
        totalTraveller,
        totalPrice: Number(totalPrice),
        status: "PaymentPending",
        travellers,
        billingInfo,
        payment: {
          amount: Number(totalPrice),
          status: "created"
        }
      });

      await booking.save();

      return res.status(201).json({
        success: true,
        message: "Booking created successfully (old version).",
        booking,
        version: "old"
      });
    }

    /* =====================================================
       NEW VERSION — SERVER CALCULATED PRICE
    ===================================================== */
    if (!roomType || !occupancy) {
      return res.status(400).json({
        message: "roomType and occupancy are required for price calculation."
      });
    }

    const costData = await calculatePackageCostInternal({
      holidayPackageId: packageId,
      vehicleId,
      hotel_id: hotelId,
      roomType,
      startDate,
      endDate,
      occupancy,
      childWithBed,
      childWithoutBed,
      priceMarkup
    });

    if (!costData.success) {
      return res.status(400).json({
        message: costData.message
      });
    }

    const room = hotel.rooms.find(r =>
      r.roomType.toLowerCase().replace(/[^a-z0-9]/g, "") ===
      roomType.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    if (!room) {
      return res.status(400).json({
        message: "Selected room type not found in hotel."
      });
    }

    const childWithBedPrice = room.child?.childWithBedPrice || 0;
    const childWithoutBedPrice = room.child?.childWithoutBedPrice || 0;

    const perDayAmount =
      (room.occupancyRates[occupancy - 1] || 0) +
      (childWithBed ? childWithBedPrice : 0) +
      (childWithoutBed ? childWithoutBedPrice : 0);

    const totalHotelCost = perDayAmount * costData.breakdown.days;

    const booking = new Booking({
      user: userId,
      holidayPackageId: packageId,
      vehicleId,
      hotelId,
      startDate,
      endDate,
      totalTraveller,
      totalPrice: costData.finalPackage,
      status: "PaymentPending",
      travellers,
      billingInfo,
      payment: {
        amount: costData.finalPackage,
        status: "created"
      },
      hotelDetails: {
        hotelId,
        roomType,
        occupancy,
        childWithBed,
        childWithoutBed,
        childWithBedPrice,
        childWithoutBedPrice,
        perDayRoomPrice: perDayAmount,
        totalHotelCost
      },
      costBreakup: {
        ...costData.breakdown,
        finalPackage: costData.finalPackage
      }
    });

    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully (new version).",
      booking,
      version: "new"
    });

  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message
    });
  }
};

module.exports = { createBooking };
