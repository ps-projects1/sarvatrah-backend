const Booking = require("../../models/booking");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");
const { calculatePackageCostInternal } = require("./calBooking");

const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      startDate,
      endDate,
      totalPrice,
      totalTraveller,
      vehicleId,
      hotelId,
      packageId,
      travellers,
      billingInfo,

      // NEW FLOW (holiday only)
      roomType,
      occupancy,
      childWithBed,
      childWithoutBed,
      priceMarkup,

      bookingType = "holiday"
    } = req.body;

    /* =====================
       BASIC VALIDATION
    ===================== */
    if (
      !startDate ||
      !endDate ||
      !totalTraveller ||
      !vehicleId ||
      !packageId
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
       PACKAGE VALIDATION
    ===================== */
    let holidayPackage = null;
    let pilgrimagePackage = null;

    if (bookingType === "holiday") {
      holidayPackage = await HolidayPackage.findById(packageId);
      if (!holidayPackage) {
        return res.status(404).json({
          message: "Holiday package not found."
        });
      }
    }

    if (bookingType === "pilgrimage") {
      pilgrimagePackage = await Pilgrimage.findById(packageId);
      if (!pilgrimagePackage) {
        return res.status(404).json({
          message: "Pilgrimage package not found."
        });
      }
    }

    /* =====================
       REFERENCE VALIDATION
    ===================== */
    const vehicle = await vehicleCollection.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    let hotel = null;

    if (bookingType === "holiday") {
      if (!hotelId) {
        return res.status(400).json({
          message: "Hotel is required for holiday booking."
        });
      }

      hotel = await hotelCollection.findById(hotelId);
      if (!hotel)
        return res.status(404).json({ message: "Hotel not found." });
    }

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
    ===================================================== */
    if (totalPrice) {

      const bookingData = {
        user: userId,
        bookingType,
        vehicleId,
        hotelId: bookingType === "holiday" ? hotelId : undefined,
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
      };

      if (bookingType === "holiday") {
        bookingData.holidayPackageId = packageId;
      }

      if (bookingType === "pilgrimage") {
        bookingData.pilgrimagePackageId = packageId;
      }

      const booking = new Booking(bookingData);
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

    let finalPrice = 0;
    let costBreakup = {};
    let hotelDetails = null;

    /* =====================
       HOLIDAY PRICE FLOW
    ===================== */
    if (bookingType === "holiday") {

      if (!roomType || !occupancy) {
        return res.status(400).json({
          message: "roomType and occupancy are required."
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

      const totalHotelCost =
        perDayAmount * costData.breakdown.days;

      finalPrice = costData.finalPackage;

      costBreakup = {
        ...costData.breakdown,
        finalPackage: costData.finalPackage
      };

      hotelDetails = {
        hotelId,
        roomType,
        occupancy,
        childWithBed,
        childWithoutBed,
        childWithBedPrice,
        childWithoutBedPrice,
        perDayRoomPrice: perDayAmount,
        totalHotelCost
      };
    }

    /* =====================
       PILGRIMAGE PRICE FLOW
    ===================== */
    if (bookingType === "pilgrimage") {

      const vehicleData = pilgrimagePackage.vehiclePrices.find(
        v => v.vehicle_id === vehicleId.toString()
      );

      if (!vehicleData) {
        return res.status(400).json({
          message: "Vehicle price not found in pilgrimage package."
        });
      }

      const basePrice = pilgrimagePackage.basePrice || 0;
      const vehiclePrice = vehicleData.price || 0;
      const markup = pilgrimagePackage.priceMarkup || 0;

      const totalBase = basePrice * Number(totalTraveller);

      finalPrice = totalBase + vehiclePrice + markup;

      costBreakup = {
        days: pilgrimagePackage.packageDuration.days,
        hotelCost: totalBase,
        vehicleCost: vehiclePrice,
        priceMarkup: markup,
        finalPackage: finalPrice
      };
    }

    /* =====================
       CREATE BOOKING
    ===================== */

    const bookingData = {
      user: userId,
      bookingType,
      vehicleId,
      hotelId: bookingType === "holiday" ? hotelId : undefined,
      startDate,
      endDate,
      totalTraveller,
      totalPrice: finalPrice,
      status: "PaymentPending",
      travellers,
      billingInfo,
      payment: {
        amount: finalPrice,
        status: "created"
      },
      costBreakup
    };

    if (bookingType === "holiday") {
      bookingData.holidayPackageId = packageId;
      bookingData.hotelDetails = hotelDetails;
    }

    if (bookingType === "pilgrimage") {
      bookingData.pilgrimagePackageId = packageId;
    }

    const booking = new Booking(bookingData);
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
