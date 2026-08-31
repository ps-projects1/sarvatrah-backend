const Booking = require("../../models/booking");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const Experience = require("../../models/experience");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");

const {
  calculatePackageCostInternal
} = require("./calBooking");

const {
  calculateExperienceCostInternal
} = require("./calExperienceBooking");

const generateBookingInvoice =
  require("../../helper/bookingInvoice");

const {
  generateVoucherPDF,
  generateItineraryPDF
} = require("../../helper/bookingPDFs");

const {
  sendBookingInvoiceEmail
} = require("../../helper/sendMail");

const uploadToSupabase =
  require("../../utils/uploadToSupabase");

const Admin = require("../../models/admin");

const {
  GST_PERCENT
} = require("../../config/taxConfig");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ============================================================
// COMPLETE PAYMENT ORDER
// ============================================================

const completePaymentOrder = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking =
      await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      booking.status === "Confirmed" &&
      booking.payment.status === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking already fully paid"
      });
    }

    /* =========================
       CALCULATE REMAINING AMOUNT
    ========================= */

    const subTotal =
      booking.totalPrice || 0;

    const taxPercent =
      GST_PERCENT;

    const taxAmount =
      Math.round(
        (subTotal * taxPercent) / 100
      );

    const totalAmount =
      subTotal + taxAmount;

    const paidAmount =
      booking.partialAmount || 0;

    const remainingAmount =
      totalAmount - paidAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No pending amount"
      });
    }

    /* =========================
       CREATE ORDER
    ========================= */

    const order =
      await razorpay.orders.create({
        amount:
          Math.round(remainingAmount * 100),

        currency: "INR",

        receipt:
          `booking_${booking._id}`
      });

    /* =========================
       SAVE ORDER
    ========================= */

    booking.payment.orderId =
      order.id;

    booking.payment.pendingAmount =
      remainingAmount;

    booking.payment.amount =
      remainingAmount;

    booking.payment.status =
      "created";

    await booking.save();

    return res.status(200).json({
      success: true,
      order,
      amount: remainingAmount
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create payment order"
    });
  }
};


// ============================================================
// CREATE BOOKING
// ============================================================

const createBooking = async (req, res) => {

  try {

    const userId =
      req.user._id;

    const {
      startDate,
      endDate,

      totalTraveller,

      // NEW
      vehicleIds = [],

      // BACKWARD COMPATIBILITY
      vehicleId,

      packageId,

      travellers,

      billingInfo,

      selectedHotels = [],

      childWithBed,
      childWithoutBed,

      // This is retained for compatibility,
      // but pricing is calculated from package DB.
      priceMarkup,

      partialPayment = false,

      pricingId,
      pickupType,

      bookingType = "holiday"

    } = req.body;


    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (
      !packageId ||
      !totalTraveller
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Missing required fields."
      });

    }


    // ========================================================
    // NORMALIZE VEHICLE IDS
    // ========================================================

    let selectedVehicleIds = [];

    if (Array.isArray(vehicleIds)) {

      selectedVehicleIds =
        vehicleIds
          .filter(Boolean)
          .map(id => String(id));

    }

    /*
     * Backward compatibility:
     *
     * Old request:
     *
     * vehicleId: "123"
     *
     * becomes:
     *
     * vehicleIds: ["123"]
     */

    if (
      selectedVehicleIds.length === 0 &&
      vehicleId
    ) {

      selectedVehicleIds = [
        String(vehicleId)
      ];

    }


    // ========================================================
    // USER VALIDATION
    // ========================================================

    const user =
      await User.findById(userId);

    if (!user) {

      return res.status(404).json({
        message:
          "User not found."
      });

    }

    if (user.userRole !== 0) {

      return res.status(403).json({
        message:
          "Only users can book."
      });

    }


    // ========================================================
    // PACKAGE VALIDATION
    // ========================================================

    let holidayPackage = null;
    let pilgrimagePackage = null;
    let experience = null;


    // ========================================================
    // HOLIDAY
    // ========================================================

    if (bookingType === "holiday") {

      if (
        !startDate ||
        !endDate ||
        selectedVehicleIds.length === 0 ||
        !selectedHotels?.length
      ) {

        return res.status(400).json({
          message:
            "Missing required holiday booking fields. At least one vehicle and selected hotels are required."
        });

      }


      holidayPackage =
        await HolidayPackage.findById(
          packageId
        );


      if (!holidayPackage) {

        return res.status(404).json({
          message:
            "Holiday package not found."
        });

      }

    }


    // ========================================================
    // PILGRIMAGE
    // ========================================================

    if (bookingType === "pilgrimage") {

      if (
        !startDate ||
        !endDate ||
        selectedVehicleIds.length === 0
      ) {

        return res.status(400).json({
          message:
            "Missing required pilgrimage booking fields."
        });

      }


      pilgrimagePackage =
        await Pilgrimage.findById(
          packageId
        );


      if (!pilgrimagePackage) {

        return res.status(404).json({
          message:
            "Pilgrimage package not found."
        });

      }

    }


    // ========================================================
    // EXPERIENCE
    // ========================================================

    if (bookingType === "experience") {

      experience =
        await Experience.findById(
          packageId
        ).populate("pricing");


      if (!experience) {

        return res.status(404).json({
          message:
            "Experience not found."
        });

      }

    }


    // ========================================================
    // VEHICLE VALIDATION
    // ========================================================

    /*
     * Validate EVERY selected vehicle.
     *
     * We intentionally don't only validate the first vehicle.
     */

    const validatedVehicles = [];

    for (
      const selectedVehicleId
      of selectedVehicleIds
    ) {

      const vehicle =
        await vehicleCollection.findById(
          selectedVehicleId
        );


      if (!vehicle) {

        return res.status(404).json({
          message:
            `Vehicle not found: ${selectedVehicleId}`
        });

      }


      validatedVehicles.push(
        vehicle
      );

    }


    // ========================================================
    // HOLIDAY HOTEL VALIDATION
    // ========================================================

    if (bookingType === "holiday") {

      for (
        const hotelSelection
        of selectedHotels
      ) {

        const hotel =
          await hotelCollection.findById(
            hotelSelection.hotelId
          );


        if (!hotel) {

          return res.status(404).json({
            message:
              `Hotel not found for day ${hotelSelection.dayNo}`
          });

        }

      }

    }


    // ========================================================
    // TRAVELLER VALIDATION
    // ========================================================

    if (
      !Array.isArray(travellers) ||
      travellers.length === 0
    ) {

      return res.status(400).json({
        message:
          "Travellers data is required."
      });

    }


    if (
      travellers.filter(
        t => t.isLeadTraveller
      ).length !== 1
    ) {

      return res.status(400).json({
        message:
          "There must be exactly one lead traveller."
      });

    }


    if (
      travellers.length !==
      Number(totalTraveller)
    ) {

      return res.status(400).json({
        message:
          "Total travellers count mismatch."
      });

    }


    // ========================================================
    // SERVER PRICE CALCULATION
    // ========================================================

    let finalPrice = 0;

    let costBreakup = {};

    let hotelDetails = null;


    // ========================================================
    // HOLIDAY FLOW
    // ========================================================

    if (bookingType === "holiday") {

      const costData =
        await calculatePackageCostInternal({

          holidayPackageId:
            packageId,

          // NEW
          vehicleIds:
            selectedVehicleIds,

          selectedHotels,

          startDate,
          endDate,

          totalTraveller,

          childWithBed,
          childWithoutBed,

          // Kept only for backward
          // compatibility. The calculator
          // uses package values.
          priceMarkup

        });


      if (!costData.success) {

        return res.status(400).json({
          success: false,
          message:
            costData.message
        });

      }


      finalPrice =
        costData.finalPackage;


      costBreakup = {

        ...costData.breakdown,

        finalPackage:
          costData.finalPackage

      };


      hotelDetails = {

        selectedHotels,

        childWithBed:
          !!childWithBed,

        childWithoutBed:
          !!childWithoutBed

      };

    }


    // ========================================================
    // PILGRIMAGE FLOW
    // ========================================================

    if (bookingType === "pilgrimage") {

      /*
       * For pilgrimage, process all selected
       * vehicles as well.
       */

      let vehicleCost = 0;

      const vehicleBreakdown = [];


      for (
        const selectedVehicleId
        of selectedVehicleIds
      ) {

        const vehicleData =
          pilgrimagePackage.vehiclePrices.find(
            v =>
              String(v.vehicle_id) ===
              String(selectedVehicleId)
          );


        if (!vehicleData) {

          return res.status(400).json({
            message:
              `Vehicle price not found in pilgrimage package: ${selectedVehicleId}`
          });

        }


        const vehiclePrice =
          Number(
            vehicleData.price || 0
          );


        vehicleCost +=
          vehiclePrice;


        vehicleBreakdown.push({

          vehicleId:
            selectedVehicleId,

          vehicleType:
            vehicleData.vehicleType,

          price:
            vehiclePrice

        });

      }


      const basePrice =
        Number(
          pilgrimagePackage.basePrice || 0
        );


      const totalBase =
        basePrice *
        Number(totalTraveller);


      const markup =
        Number(
          pilgrimagePackage.priceMarkup || 0
        );


      finalPrice =
        totalBase +
        vehicleCost +
        markup;


      costBreakup = {

        days:
          pilgrimagePackage
            .packageDuration
            .days,

        hotelCost:
          totalBase,

        vehicleCost,

        vehicleIds:
          selectedVehicleIds,

        vehicleBreakdown,

        priceMarkup:
          markup,

        finalPackage:
          finalPrice

      };

    }


    // ========================================================
    // EXPERIENCE FLOW
    // ========================================================

    if (bookingType === "experience") {

      if (!pricingId) {

        return res.status(400).json({
          message:
            "pricingId is required for experience booking."
        });

      }


      const selectedPricing =
        experience.pricing.find(
          p =>
            p._id.toString() ===
            pricingId
        );


      if (!selectedPricing) {

        return res.status(400).json({
          message:
            "Selected pricing option not found."
        });

      }


      const basePrice =
        Number(
          selectedPricing.price || 0
        );


      finalPrice =
        basePrice *
        Number(totalTraveller);


      if (
        pickupType &&
        experience
          .travelling_facility
          ?.[pickupType]
          ?.price
      ) {

        finalPrice +=
          Number(
            experience
              .travelling_facility
              [pickupType]
              .price
          );

      }


      costBreakup = {

        days: 1,

        hotelCost: 0,

        vehicleCost: 0,

        priceMarkup: 0,

        finalPackage:
          finalPrice

      };

    }


    // ========================================================
    // PAYMENT CALCULATION
    // ========================================================

    const subtotal =
      finalPrice;


    const taxAmount =
      Math.round(
        (subtotal * GST_PERCENT) /
        100
      );


    const grandTotal =
      subtotal +
      taxAmount;


    // ========================================================
    // CREATE BOOKING DATA
    // ========================================================

    const bookingData = {

      user:
        userId,

      bookingType,

      /*
       * NEW:
       *
       * Save all selected vehicles.
       */
      vehicleIds:
        selectedVehicleIds,

      /*
       * BACKWARD COMPATIBILITY:
       *
       * Keep the first vehicle in the
       * old vehicleId field.
       */
      vehicleId:
        selectedVehicleIds.length > 0
          ? selectedVehicleIds[0]
          : undefined,

      hotelId:
        bookingType === "holiday"
          ? selectedHotels?.[0]
              ?.hotelId
          : undefined,

      startDate,

      endDate,

      totalTraveller,

      totalPrice:
        finalPrice,

      status:
        "PaymentPending",

      travellers,

      billingInfo,

      payment: {

        subtotal,

        taxAmount,

        totalAmount:
          grandTotal,

        paidAmount: 0,

        pendingAmount:
          grandTotal,

        amount:
          grandTotal,

        status:
          "created"

      },

      costBreakup

    };


    // ========================================================
    // PACKAGE REFERENCES
    // ========================================================

    if (
      bookingType === "holiday"
    ) {

      bookingData.holidayPackageId =
        packageId;

      bookingData.hotelDetails =
        hotelDetails;

    }


    if (
      bookingType === "pilgrimage"
    ) {

      bookingData.pilgrimagePackageId =
        packageId;

    }


    if (
      bookingType === "experience"
    ) {

      bookingData.experienceId =
        packageId;

    }


    // ========================================================
    // SAVE BOOKING
    // ========================================================

    const booking =
      new Booking(
        bookingData
      );


    await booking.save();


    // ========================================================
    // PARTIAL PAYMENT
    // ========================================================

    const activePackage =
      holidayPackage ||
      pilgrimagePackage;


    if (
      partialPayment === true &&
      activePackage?.partialPayment
    ) {

      const dueDays =
        Number(
          activePackage
            .partialPaymentDueDays || 0
        );


      const percentage =
        Number(
          activePackage
            .partialPaymentPercentage || 0
        );


      // Partial payment is calculated
      // from grand total including GST.

      const partialAmount =
        Math.round(
          (grandTotal *
            percentage) /
            100
        );


      booking.partialPayment =
        true;


      booking.partialPaymentDueDays =
        dueDays;


      booking.partialPaymentPercentage =
        percentage;


      booking.partialAmount =
        partialAmount;


      /*
       * Due date is calculated from the
       * booking start date.
       */

      booking.partialPaymentDueDate =
        new Date(
          new Date(startDate).getTime() -
          dueDays *
            24 *
            60 *
            60 *
            1000
        );


      booking.payment.status =
        "partial";


      booking.payment.paidAmount =
        partialAmount;


      booking.payment.pendingAmount =
        grandTotal -
        partialAmount;


      booking.payment.amount =
        partialAmount;


      await booking.save();

    }


    // ========================================================
    // GENERATE DOCUMENTS
    // ========================================================

    try {

      const updatedBooking =
        await Booking.findById(
          booking._id
        )
          .populate(
            "user",
            "firstname lastname email"
          )
          .populate(
            "holidayPackageId"
          )
          .populate(
            "pilgrimagePackageId"
          )
          .populate(
            "experienceId"
          )
          .populate(
            "hotelId"
          )
          .populate(
            "vehicleId"
          )
          .populate(
            "vehicleIds"
          );


      // ======================================================
      // INVOICE
      // ======================================================

      const pdfPath =
        await generateBookingInvoice({
          booking:
            updatedBooking,

          user:
            updatedBooking.user
        });


      // ======================================================
      // VOUCHER
      // ======================================================

      const voucherPdfPath =
        await generateVoucherPDF({

          booking:
            updatedBooking,

          user:
            updatedBooking.user

        });


      // ======================================================
      // ITINERARY
      // ======================================================

      const ItineraryPdfPath =
        await generateItineraryPDF({

          booking:
            updatedBooking,

          user:
            updatedBooking.user

        });


      let invoiceUrl;

      let voucherPdfUrl;

      let ItineraryPdfUrl;


      // ======================================================
      // UPLOAD FILES
      // ======================================================

      try {

        invoiceUrl =
          await uploadToSupabase(
            pdfPath,
            `booking-invoice-${booking._id}.pdf`,
            "booking-invoices"
          );


        voucherPdfUrl =
          await uploadToSupabase(
            voucherPdfPath,
            `booking-voucher-${booking._id}.pdf`,
            "booking-invoices"
          );


        ItineraryPdfUrl =
          await uploadToSupabase(
            ItineraryPdfPath,
            `booking-itinerary-${booking._id}.pdf`,
            "booking-invoices"
          );


      } catch (uploadError) {

        console.error(
          "Supabase upload failed:",
          uploadError.message
        );

        console.error(
          "Full upload error:",
          uploadError
        );

        invoiceUrl =
          pdfPath;

      }


      // ======================================================
      // SAVE DOCUMENT URLS
      // ======================================================

      booking.invoice =
        invoiceUrl;

      booking.voucherPdf =
        voucherPdfUrl;

      booking.itineraryPdf =
        ItineraryPdfUrl;


      await booking.save();


      // ======================================================
      // SEND EMAIL TO CUSTOMER
      // ======================================================

      sendBookingInvoiceEmail({

        email:
          [
            updatedBooking
              .user
              ?.email,

            updatedBooking
              .billingInfo
              ?.email

          ]
            .filter(Boolean)
            .join(","),

        booking:
          updatedBooking,

        invoiceUrl,

        voucherPdfUrl,

        ItineraryPdfUrl

      });


      // ======================================================
      // SEND EMAIL TO ADMIN
      // ======================================================

      const admin =
        await Admin.findOne({
          userRole: 1
        }).select("email");


      if (
        admin &&
        admin.email
      ) {

        sendBookingInvoiceEmail({

          email:
            admin.email,

          booking:
            updatedBooking,

          invoiceUrl,

          voucherPdfUrl,

          ItineraryPdfUrl

        });

      }


    } catch (err) {

      console.error(
        "Booking invoice process failed:",
        err
      );

    }


    // ========================================================
    // FINAL POPULATED BOOKING
    // ========================================================

    const populatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate(
          "user",
          "firstname lastname email"
        )
        .populate(
          "holidayPackageId",
          "packageName uniqueId"
        )
        .populate(
          "pilgrimagePackageId"
        )
        .populate(
          "experienceId"
        )
        .populate(
          "hotelId"
        )
        .populate(
          "vehicleIds"
        )
        .lean();


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({

      success: true,

      message:
        "Booking created successfully.",

      booking:
        populatedBooking,

      version:
        "new"

    });


  } catch (error) {

    console.error(
      "Create Booking Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Error creating booking",

      error:
        error.message

    });

  }

};


// ============================================================
// CREATE EXPERIENCE BOOKING
// ============================================================

const createExperienceBooking =
  async (req, res) => {

    try {

      const userId =
        req.user._id;

      const {
        experienceId,
        pricingId,
        travelDate,
        startTimeId,
        pickupType,
        totalTraveller,
        travellers,
        billingInfo
      } = req.body;


      if (
        !experienceId ||
        !pricingId ||
        !totalTraveller
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Missing required fields."
        });

      }


      const user =
        await User.findById(
          userId
        );


      if (!user) {

        return res.status(404).json({
          message:
            "User not found."
        });

      }


      if (
        user.userRole !== 0
      ) {

        return res.status(403).json({
          message:
            "Only users can book."
        });

      }


      const experience =
        await Experience.findById(
          experienceId
        )
          .populate("pricing")
          .populate(
            "availability_detail"
          )
          .populate("start_time");


      if (!experience) {

        return res.status(404).json({
          message:
            "Experience not found."
        });

      }


      const selectedPricing =
        experience.pricing.find(
          p =>
            p._id.toString() ===
            pricingId
        );


      if (!selectedPricing) {

        return res.status(400).json({
          message:
            "Selected pricing not found."
        });

      }


      if (
        !Array.isArray(
          travellers
        ) ||
        travellers.length === 0
      ) {

        return res.status(400).json({
          message:
            "Travellers data is required."
        });

      }


      if (
        travellers.filter(
          t =>
            t.isLeadTraveller
        ).length !== 1
      ) {

        return res.status(400).json({
          message:
            "There must be exactly one lead traveller."
        });

      }


      if (
        travellers.length !==
        Number(totalTraveller)
      ) {

        return res.status(400).json({
          message:
            "Total travellers count mismatch."
        });

      }


      if (
        experience.availabilityType ===
          "date_time" &&
        !startTimeId
      ) {

        return res.status(400).json({
          message:
            "Start time is required for this experience."
        });

      }


      const costData =
        await calculateExperienceCostInternal({

          experienceId,

          pricingId,

          totalTraveller,

          pickupType

        });


      if (!costData.success) {

        return res.status(400).json({

          success: false,

          message:
            costData.message

        });

      }


      const finalPrice =
        costData.finalPackage;


      const costBreakup =
        costData.breakdown;


      const subtotal =
        finalPrice;


      const taxAmount =
        Math.round(
          (subtotal *
            GST_PERCENT) /
            100
        );


      const grandTotal =
        subtotal +
        taxAmount;


      const bookingData = {

        user:
          userId,

        bookingType:
          "experience",

        experienceId,

        travelDate,

        startDate:
          travelDate,

        endDate:
          travelDate,

        startTimeId,

        totalTraveller,

        totalPrice:
          finalPrice,

        status:
          "PaymentPending",

        travellers,

        billingInfo,

        pickupType,

        pricingId,

        payment: {

          subtotal,

          taxAmount,

          totalAmount:
            grandTotal,

          paidAmount: 0,

          pendingAmount:
            grandTotal,

          amount:
            grandTotal,

          status:
            "created"

        },

        costBreakup

      };


      const booking =
        new Booking(
          bookingData
        );


      await booking.save();


      try {

        const updatedBooking =
          await Booking.findById(
            booking._id
          )
            .populate(
              "user",
              "firstname lastname email"
            )
            .populate(
              "holidayPackageId"
            )
            .populate(
              "pilgrimagePackageId"
            )
            .populate(
              "experienceId"
            )
            .populate(
              "hotelId"
            )
            .populate(
              "vehicleId"
            )
            .populate(
              "vehicleIds"
            );


        const pdfPath =
          await generateBookingInvoice({
            booking:
              updatedBooking,
            user:
              updatedBooking.user
          });


        const voucherPdfPath =
          await generateVoucherPDF({
            booking:
              updatedBooking,
            user:
              updatedBooking.user
          });


        const ItineraryPdfPath =
          await generateItineraryPDF({
            booking:
              updatedBooking,
            user:
              updatedBooking.user
          });


        let invoiceUrl;
        let voucherPdfUrl;
        let ItineraryPdfUrl;


        try {

          invoiceUrl =
            await uploadToSupabase(
              pdfPath,
              `booking-invoice-${booking._id}.pdf`,
              "booking-invoices"
            );


          voucherPdfUrl =
            await uploadToSupabase(
              voucherPdfPath,
              `booking-voucher-${booking._id}.pdf`,
              "booking-invoices"
            );


          ItineraryPdfUrl =
            await uploadToSupabase(
              ItineraryPdfPath,
              `booking-itinerary-${booking._id}.pdf`,
              "booking-invoices"
            );


        } catch (uploadError) {

          console.error(
            "Supabase upload failed:",
            uploadError.message
          );

          console.error(
            "Full upload error:",
            uploadError
          );

          invoiceUrl =
            pdfPath;

        }


        booking.invoice =
          invoiceUrl;

        booking.voucherPdf =
          voucherPdfUrl;

        booking.itineraryPdf =
          ItineraryPdfUrl;


        await booking.save();


        sendBookingInvoiceEmail({

          email:
            [
              updatedBooking
                .user
                ?.email,

              updatedBooking
                .billingInfo
                ?.email

            ]
              .filter(Boolean)
              .join(","),

          booking:
            updatedBooking,

          invoiceUrl,

          voucherPdfUrl,

          ItineraryPdfUrl

        });


      } catch (err) {

        console.error(
          "Booking invoice process failed:",
          err
        );

      }


      const populatedBooking =
        await Booking.findById(
          booking._id
        )
          .populate(
            "user",
            "firstname lastname email"
          )
          .populate(
            "holidayPackageId",
            "packageName uniqueId"
          )
          .lean();


      return res.status(201).json({

        success: true,

        message:
          "Experience booking created successfully.",

        booking:
          populatedBooking

      });


    } catch (error) {

      console.error(
        "Experience Booking Error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Error creating experience booking",

        error:
          error.message

      });

    }

  };


module.exports = {
  createBooking,
  createExperienceBooking,
  completePaymentOrder
};