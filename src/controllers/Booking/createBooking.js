const Booking = require("../../models/booking");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const Experience = require("../../models/experience");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");
const { calculatePackageCostInternal } = require("./calBooking");
const generateBookingInvoice = require("../../helper/bookingInvoice");
const { sendBookingInvoiceEmail } = require("../../helper/sendMail");
const uploadToSupabase = require("../../utils/uploadToSupabase");
const Admin = require("../../models/admin");


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

      // Holiday fields
      roomType,
      occupancy,
      childWithBed,
      childWithoutBed,
      priceMarkup,

      // Experience fields
      pricingId,
      pickupType,

      bookingType = "holiday"
    } = req.body;

    /* =====================
       BASIC VALIDATION
    ===================== */
    if (!packageId || !totalTraveller) {
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
    let experience = null;

    if (bookingType === "holiday") {
      if (!startDate || !endDate || !vehicleId || !hotelId) {
        return res.status(400).json({
          message: "Missing required holiday booking fields."
        });
      }

      holidayPackage = await HolidayPackage.findById(packageId);
      if (!holidayPackage)
        return res.status(404).json({ message: "Holiday package not found." });
    }

    if (bookingType === "pilgrimage") {
      if (!startDate || !endDate || !vehicleId) {
        return res.status(400).json({
          message: "Missing required pilgrimage booking fields."
        });
      }

      pilgrimagePackage = await Pilgrimage.findById(packageId);
      if (!pilgrimagePackage)
        return res.status(404).json({ message: "Pilgrimage package not found." });
    }

    if (bookingType === "experience") {
      experience = await Experience.findById(packageId).populate("pricing");
      if (!experience)
        return res.status(404).json({ message: "Experience not found." });
    }

    /* =====================
       REFERENCE VALIDATION
    ===================== */
    let vehicle = null;
    if (vehicleId) {
      vehicle = await vehicleCollection.findById(vehicleId);
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found." });
    }

    let hotel = null;
    if (bookingType === "holiday") {
      hotel = await hotelCollection.findById(hotelId);
      if (!hotel)
        return res.status(404).json({ message: "Hotel not found." });
    }

    /* =====================
       TRAVELLER VALIDATION
    ===================== */
    if (!Array.isArray(travellers) || travellers.length === 0)
      return res.status(400).json({
        message: "Travellers data is required."
      });

    if (travellers.filter(t => t.isLeadTraveller).length !== 1)
      return res.status(400).json({
        message: "There must be exactly one lead traveller."
      });

    if (travellers.length !== Number(totalTraveller))
      return res.status(400).json({
        message: "Total travellers count mismatch."
      });

    /* =====================================================
       OLD VERSION — CLIENT PROVIDED PRICE
    ===================================================== */
    if (totalPrice) {

      const bookingData = {
        user: userId,
        bookingType,
        vehicleId,
        hotelId: hotelId,
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

      if (bookingType === "holiday")
        bookingData.holidayPackageId = packageId;

      if (bookingType === "pilgrimage")
        bookingData.pilgrimagePackageId = packageId;

      if (bookingType === "experience")
        bookingData.experienceId = packageId;

      const booking = new Booking(bookingData);
      await booking.save();

      /* =====================
         PARTIAL PAYMENT LOGIC
      ===================== */

      if (holidayPackage?.partialPayment) {

        const dueDays = holidayPackage.partialPaymentDueDays || 0;
        const percentage = holidayPackage.partialPaymentPercentage || 0;

        const partialAmount = (booking.totalPrice * percentage) / 100;

      const partialPaymentChosen = req.body.partialPayment === true;

if (holidayPackage?.partialPayment && partialPaymentChosen) {
  const dueDays = holidayPackage.partialPaymentDueDays || 0;
  const percentage = holidayPackage.partialPaymentPercentage || 0;
  const partialAmount = Math.round((booking.totalPrice * percentage) / 100);

  booking.partialPayment = true;
  booking.partialPaymentDueDays = dueDays;
  booking.partialPaymentPercentage = percentage;
  booking.partialAmount = partialAmount;
  booking.partialPaymentDueDate = new Date(
    Date.now() + dueDays * 24 * 60 * 60 * 1000
  );
  booking.payment.amount = partialAmount;  

  await booking.save();
}
      }

      try {

        const populatedUser = await booking.populate(
          "user",
          "firstname lastname email"
        );

        // Generate invoice
        const pdfPath = await generateBookingInvoice({
          booking,
          user: populatedUser.user
        });

        let invoiceUrl;

        try {
          invoiceUrl = await uploadToSupabase(
            pdfPath,
            `booking-invoice-${booking._id}.pdf`,
            "booking-invoices"
          );
        } catch (uploadError) {
          console.warn("Supabase upload failed:", uploadError.message);
          invoiceUrl = pdfPath;
        }

        // Save invoice URL
        booking.invoice = invoiceUrl;
        await booking.save();

        // Send email
        await sendBookingInvoiceEmail({
          email: populatedUser.user.email,
          bookingId: booking._id,
          amount: booking.totalPrice,
          invoiceUrl
        });

      } catch (err) {
        console.error("Booking invoice process failed:", err);
      }

      const populatedBooking = await Booking.findById(booking._id)
        .populate("user", "firstname lastname email")
        .populate("holidayPackageId", "packageName uniqueId")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Booking created successfully (old version).",
        booking: populatedBooking,
        version: "old"
      });
    }

    /* =====================================================
       NEW VERSION — SERVER CALCULATION
    ===================================================== */

    let finalPrice = 0;
    let costBreakup = {};
    let hotelDetails = null;

    /* =====================
       HOLIDAY FLOW
    ===================== */
    if (bookingType === "holiday") {

      if (!roomType || !occupancy)
        return res.status(400).json({
          message: "roomType and occupancy are required."
        });

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

      if (!costData.success)
        return res.status(400).json({
          message: costData.message
        });

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
        childWithoutBed
      };
    }

    /* =====================
       PILGRIMAGE FLOW
    ===================== */
    if (bookingType === "pilgrimage") {

      const vehicleData = pilgrimagePackage.vehiclePrices.find(
        v => v.vehicle_id === vehicleId.toString()
      );

      if (!vehicleData)
        return res.status(400).json({
          message: "Vehicle price not found in pilgrimage package."
        });

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
       EXPERIENCE FLOW
    ===================== */
    if (bookingType === "experience") {

      if (!pricingId)
        return res.status(400).json({
          message: "pricingId is required for experience booking."
        });

      const selectedPricing = experience.pricing.find(
        p => p._id.toString() === pricingId
      );

      if (!selectedPricing)
        return res.status(400).json({
          message: "Selected pricing option not found."
        });

      const basePrice = selectedPricing.price || 0;

      finalPrice = basePrice * Number(totalTraveller);

      if (
        pickupType &&
        experience.travelling_facility?.[pickupType]?.price
      ) {
        finalPrice += experience.travelling_facility[pickupType].price;
      }

      costBreakup = {
        days: 1,
        hotelCost: 0,
        vehicleCost: 0,
        priceMarkup: 0,
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

    if (bookingType === "pilgrimage")
      bookingData.pilgrimagePackageId = packageId;

    if (bookingType === "experience")
      bookingData.experienceId = packageId;

    const booking = new Booking(bookingData);
    await booking.save();

    try {

      const populatedUser = await booking.populate(
        "user",
        "firstname lastname email"
      );

      // Generate invoice
      const pdfPath = await generateBookingInvoice({
        booking,
        user: populatedUser.user
      });

      let invoiceUrl;

      try {
        invoiceUrl = await uploadToSupabase(
          pdfPath,
          `booking-invoice-${booking._id}.pdf`,
          "booking-invoices"
        );
      } catch (uploadError) {
        console.warn("Supabase upload failed:", uploadError.message);
        invoiceUrl = pdfPath;
      }

      // Save invoice URL
      booking.invoice = invoiceUrl;
      await booking.save();

      // Send email
      await sendBookingInvoiceEmail({
        email: populatedUser.user.email,
        bookingId: booking._id,
        amount: booking.totalPrice,
        invoiceUrl
      });

      const admin = await Admin.findOne({ userRole: 1 }).select("email");

      // Send email to super admin
      if (admin && admin.email) {
        await sendBookingInvoiceEmail({
          email: admin.email,
          bookingId: booking._id,
          amount: booking.totalPrice,
          invoiceUrl
        });
      }

    } catch (err) {
      console.error("Booking invoice process failed:", err);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "firstname lastname email")
      .populate("holidayPackageId", "packageName uniqueId")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking: populatedBooking,
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

const createExperienceBooking = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      experienceId,
      pricingId,
      travelDate,
      startTimeId,      // optional (if date_time type)
      pickupType,       // pick_up_and_drop | pick_up_only | drop_only
      totalTraveller,
      travellers,
      billingInfo
    } = req.body;

    /* ===============================
       BASIC VALIDATION
    =============================== */
    if (!experienceId || !pricingId || !totalTraveller) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields."
      });
    }

    /* ===============================
       USER VALIDATION
    =============================== */
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found." });

    if (user.userRole !== 0)
      return res.status(403).json({ message: "Only users can book." });

    /* ===============================
       EXPERIENCE VALIDATION
    =============================== */
    const experience = await Experience.findById(experienceId)
      .populate("pricing")
      .populate("availability_detail")
      .populate("start_time");

    if (!experience)
      return res.status(404).json({
        message: "Experience not found."
      });

    /* ===============================
       PRICING VALIDATION
    =============================== */
    const selectedPricing = experience.pricing.find(
      (p) => p._id.toString() === pricingId
    );

    if (!selectedPricing) {
      return res.status(400).json({
        message: "Selected pricing not found."
      });
    }

    /* ===============================
       TRAVELLER VALIDATION
    =============================== */
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

    /* ===============================
       AVAILABILITY VALIDATION
    =============================== */

    if (experience.availabilityType === "date_time" && !startTimeId) {
      return res.status(400).json({
        message: "Start time is required for this experience."
      });
    }

    /* ===============================
       PRICE CALCULATION
    =============================== */

    let finalPrice = 0;

    const basePrice = selectedPricing.price || 0;
    finalPrice = basePrice * Number(totalTraveller);

    // Add pickup cost if selected
    if (
      pickupType &&
      experience.travelling_facility?.[pickupType]?.price
    ) {
      finalPrice += experience.travelling_facility[pickupType].price;
    }

    /* ===============================
       CREATE BOOKING
    =============================== */

    const bookingData = {
      user: userId,
      bookingType: "experience",
      experienceId,
      travelDate,
      startTimeId,
      totalTraveller,
      totalPrice: finalPrice,
      status: "PaymentPending",
      travellers,
      billingInfo,
      pickupType,
      pricingId,
      payment: {
        amount: finalPrice,
        status: "created"
      },
      costBreakup: {
        basePrice,
        totalTraveller,
        pickupCharge:
          pickupType &&
            experience.travelling_facility?.[pickupType]?.price
            ? experience.travelling_facility[pickupType].price
            : 0,
        finalPrice
      }
    };

    const booking = new Booking(bookingData);
    await booking.save();

    try {

      const populatedUser = await booking.populate(
        "user",
        "firstname lastname email"
      );

      // Generate invoice
      const pdfPath = await generateBookingInvoice({
        booking,
        user: populatedUser.user
      });

      let invoiceUrl;

      try {
        invoiceUrl = await uploadToSupabase(
          pdfPath,
          `booking-invoice-${booking._id}.pdf`,
          "booking-invoices"
        );
      } catch (uploadError) {
        console.warn("Supabase upload failed:", uploadError.message);
        invoiceUrl = pdfPath;
      }

      // Save invoice URL
      booking.invoice = invoiceUrl;
      await booking.save();

      // Send email
      await sendBookingInvoiceEmail({
        email: populatedUser.user.email,
        bookingId: booking._id,
        amount: booking.totalPrice,
        invoiceUrl
      });

    } catch (err) {
      console.error("Booking invoice process failed:", err);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "firstname lastname email")
      .populate("holidayPackageId", "packageName uniqueId")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Experience booking created successfully.",
      booking: populatedBooking
    });

  } catch (error) {
    console.error("Experience Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating experience booking",
      error: error.message
    });
  }
};


module.exports = { createBooking, createExperienceBooking };
