const Booking = require("../../models/booking");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");
const { calculatePackageCostInternal } = require("./calBooking");

const createBooking = async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      bookingDate,
      totalPrice, // ⭐ KEY SWITCH
      totalTraveller,
      vehicleId,
      hotelId,
      packageId,
      travellers,
      billingInfo,

      // NEW VERSION FIELDS
      roomType,
      occupancy,
      childWithBed,
      childWithoutBed,
      priceMarkup
    } = req.body;

    // ---------- BASIC VALIDATION ----------
    if (
      !userId || !startDate || !endDate || !bookingDate ||
      !totalTraveller || !vehicleId || !hotelId || !packageId
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // ---------- USER VALIDATION ----------
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.userRole !== 0)
      return res.status(400).json({ message: "Only users can book." });

    // ---------- REFERENCE VALIDATION ----------
    const holidayPackage = await HolidayPackage.findById(packageId);
    if (!holidayPackage)
      return res.status(404).json({ message: "Holiday package not found." });

    const vehicle = await vehicleCollection.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    const hotel = await hotelCollection.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });

    // ---------- TRAVELLERS VALIDATION ----------
    if (!Array.isArray(travellers) || travellers.length === 0) {
      return res.status(400).json({ message: "Travellers data is required." });
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

    // ---------------------------------------------------------
    // ⭐⭐ OLD VERSION — USE GIVEN totalPrice ⭐⭐
    // ---------------------------------------------------------
   if (totalPrice) {
  const booking = new Booking({
    user: userId,
    holidayPackageId: packageId,
    vehicleId,
    hotelId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    bookingDate: new Date(bookingDate),
    totalTraveller: Number(totalTraveller),

    // ⚠️ Client price (allowed by business decision)
    totalPrice: Number(totalPrice),

    // 👇 payment flow still enforced
    status: "PaymentPending",

    travellers,
    billingInfo,

    // 👇 REQUIRED for Razorpay
    payment: {
      amount: Number(totalPrice),
      status: "created",
    },
  });

  await booking.save();

  return res.status(201).json({
    message: "Booking created successfully (old version, payment pending).",
    booking,
    version: "old",
  });
}


    // ---------------------------------------------------------
    // ⭐⭐ NEW VERSION — CALCULATE PRICE INTERNALLY ⭐⭐
    // ---------------------------------------------------------
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
        message: costData.message || "Failed to calculate package cost."
      });
    }

    const calculatedPrice = costData.finalPackage;

    // Extract hotel room prices
    const room = hotel.rooms.find(r =>
      r.roomType.toLowerCase().replace(/[^a-z0-9]/g, "") ===
      roomType.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    const childWithBedPrice = room?.child?.childWithBedPrice || 0;
    const childWithoutBedPrice = room?.child?.childWithoutBedPrice || 0;

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
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      bookingDate: new Date(bookingDate),
      totalTraveller: Number(totalTraveller),
      totalPrice: Number(calculatedPrice),
     status: "PaymentPending",
      payment: {
    amount: Number(calculatedPrice),
    status: "created",
  },
      travellers,
      billingInfo,

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
        days: costData.breakdown.days,
        hotelCost: costData.breakdown.hotelCost,
        vehicleCost: costData.breakdown.vehicleFinal,
        priceMarkup: costData.breakdown.markup,
        hotelPriceFound: costData.breakdown.hotelPriceFound,
        vehiclePriceFound: costData.breakdown.vehiclePriceFound,
        finalPackage: calculatedPrice
      }
    });

    await booking.save();

    return res.status(201).json({
      message: "Booking created successfully (new version).",
      booking,
      version: "new"
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
};

module.exports = { createBooking };
