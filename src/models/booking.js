const Mongoose = require("mongoose");


// ============================================================
// TRAVELLER SCHEMA
// ============================================================

const travellerSchema =
  new Mongoose.Schema({

    name: {
      type: String,
      required: true,
      trim: true
    },

    age: {
      type: Number,
      required: true
    },

    gender: {
      type: String,
      enum: [
        "Male",
        "Female",
        "Other"
      ],
      required: true
    },

    contactNumber: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    isLeadTraveller: {
      type: Boolean,
      default: false
    },

    pickupLocation: {
      type: String,
      trim: true
    },

    dropLocation: {
      type: String,
      trim: true
    }

  });


// ============================================================
// HOTEL DETAILS
// ============================================================

const hotelDetailsSchema =
  new Mongoose.Schema({

    hotelId: {
      type:
        Mongoose.Schema.Types.ObjectId,
      ref: "Hotel"
    },

    roomType: {
      type: String
    },

    occupancy: {
      type: Number
    },

    childWithBed: {
      type: Boolean,
      default: false
    },

    childWithoutBed: {
      type: Boolean,
      default: false
    },

    childWithBedPrice: {
      type: Number,
      default: 0
    },

    childWithoutBedPrice: {
      type: Number,
      default: 0
    },

    perDayRoomPrice: {
      type: Number,
      default: 0
    },

    totalHotelCost: {
      type: Number,
      default: 0
    },

    /*
     * New selected hotel information.
     *
     * The calculator already returns selectedHotels,
     * so keep the complete selection inside booking.
     */

    selectedHotels: {
      type: [
        {
          dayNo: Number,

          hotelId: {
            type:
              Mongoose.Schema.Types.ObjectId,
            ref: "Hotel"
          },

          roomType: String,

          occupancy: Number,

          nights: Number,

          hotelName: String,

          occupancyRate: Number,

          requiredRooms: Number,

          perNightRoomPrice: Number,

          totalRoomPrice: Number
        }
      ],
      default: []
    }

  });


// ============================================================
// BILLING
// ============================================================

const billingSchema =
  new Mongoose.Schema({

    title: {
      type: String,
      trim: true
    },

    firstName: {
      type: String,
      trim: true
    },

    lastName: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true
    },

    city: {
      type: String,
      trim: true
    },

    state: {
      type: String,
      trim: true
    },

    country: {
      type: String,
      trim: true
    },

    pincode: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    contactNumber: {
      type: String,
      trim: true
    },

    gstNumber: {
      type: String,
      trim: true
    }

  });


// ============================================================
// COST BREAKUP
// ============================================================

const costBreakupSchema =
  new Mongoose.Schema({

    days: Number,

    totalTraveller: Number,

    // =========================
    // HOTEL
    // =========================

    hotelCost: Number,

    hotelPriceFound: Boolean,

    hotelBreakdown: [
      {
        dayNo: Number,

        hotelName: String,

        hotelId: {
          type:
            Mongoose.Schema.Types.ObjectId,
          ref: "Hotel"
        },

        roomType: String,

        occupancy: Number,

        occupancyRate: Number,

        requiredRooms: Number,

        nights: Number,

        perNightRoomPrice: Number,

        totalRoomPrice: Number
      }
    ],

    // =========================
    // VEHICLES
    // =========================

    vehicleCost: Number,

    vehicleFinal: Number,

    vehiclePriceFound: Boolean,

    vehicleIds: [
      {
        type:
          Mongoose.Schema.Types.ObjectId,
        ref: "vehicles"
      }
    ],

    totalVehicles: Number,

    totalVehicleSeats: Number,

    vehicleBreakdown: [

      {

        vehicleId: {
          type:
            Mongoose.Schema.Types.ObjectId,
          ref: "vehicles"
        },

        vehicleType: String,

        brandName: String,

        modelName: String,

        price: Number,

        seatLimit: Number,

        inventory: Number

      }

    ],

    // =========================
    // PACKAGE PRICING
    // =========================

    subtotal: Number,

    priceMarkup: Number,

    markup: Number,

    markupAmount: Number,

    subtotalAfterMarkup: Number,

    inflatedPercentage: Number,

    inflatedAmount: Number,

    finalPackage: Number

  }, {
    _id: false
  });


// ============================================================
// BOOKING SCHEMA
// ============================================================

const bookingSchema =
  new Mongoose.Schema({

    user: {
      type:
        Mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },


    // ========================================================
    // PACKAGE REFERENCES
    // ========================================================

    holidayPackageId: {
      type:
        Mongoose.Schema.Types.ObjectId,
      ref: "HolidayPackage"
    },

    pilgrimagePackageId: {
      type:
        Mongoose.Schema.Types.ObjectId,
      ref: "Pilgrimage"
    },

    experienceId: {
      type:
        Mongoose.Schema.Types.ObjectId,
      ref: "Experience"
    },


    // ========================================================
    // BOOKING TYPE
    // ========================================================

    bookingType: {
      type: String,

      enum: [
        "holiday",
        "pilgrimage",
        "experience"
      ],

      required: true
    },


    // ========================================================
    // VEHICLES
    // ========================================================

    /*
     * NEW FIELD
     *
     * Stores ALL selected vehicle IDs.
     *
     * Example:
     *
     * vehicleIds: [
     *   vehicle1,
     *   vehicle2,
     *   vehicle3
     * ]
     */

    vehicleIds: [
      {
        type:
          Mongoose.Schema.Types.ObjectId,

        ref:
          "vehicles"
      }
    ],


    /*
     * OLD FIELD
     *
     * Kept for backward compatibility.
     *
     * For new bookings this contains the
     * first selected vehicle.
     */

    vehicleId: {
      type:
        Mongoose.Schema.Types.ObjectId,

      ref:
        "vehicles"
    },


    // ========================================================
    // HOTEL
    // ========================================================

    hotelId: {
      type:
        Mongoose.Schema.Types.ObjectId,

      ref:
        "Hotel"
    },


    // ========================================================
    // DOCUMENTS
    // ========================================================

    invoice: {
      type: String
    },

    voucherPdf: {
      type: String
    },

    itineraryPdf: {
      type: String
    },


    // ========================================================
    // DATES
    // ========================================================

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    bookingDate: {
      type: Date,
      default: Date.now,
      required: true
    },


    // ========================================================
    // TRAVELLERS
    // ========================================================

    totalTraveller: {
      type: Number,
      required: true
    },


    // ========================================================
    // PRICE
    // ========================================================

    totalPrice: {
      type: Number,
      required: true
    },


    // ========================================================
    // STATUS
    // ========================================================

    status: {

      type: String,

      enum: [

        "Pending",

        "PaymentPending",

        "Confirmed",

        "PaymentFailed",

        "Cancelled",

        "Refunded"

      ],

      default:
        "Pending"

    },


    // ========================================================
    // TRAVELLERS
    // ========================================================

    travellers: [
      travellerSchema
    ],


    // ========================================================
    // BILLING
    // ========================================================

    billingInfo:
      billingSchema,


    // ========================================================
    // COST BREAKUP
    // ========================================================

    costBreakup:
      costBreakupSchema,


    // ========================================================
    // PAYMENT
    // ========================================================

    payment: {

      provider: {

        type: String,

        enum: [
          "razorpay"
        ],

        default:
          "razorpay"

      },

      orderId: {
        type: String
      },

      paymentId: {
        type: String
      },

      signature: {
        type: String
      },

      subtotal: {
        type: Number,
        default: 0
      },

      taxAmount: {
        type: Number,
        default: 0
      },

      totalAmount: {
        type: Number,
        default: 0
      },

      paidAmount: {
        type: Number,
        default: 0
      },

      pendingAmount: {
        type: Number,
        default: 0
      },

      amount: {
        type: Number,
        default: 0
      },

      currency: {
        type: String,
        default: "INR"
      },

      status: {

        type: String,

        enum: [
          "created",
          "paid",
          "failed",
          "refunded",
          "partial"
        ],

        default:
          "created"

      },

      paidAt: {
        type: Date
      }

    },


    // ========================================================
    // HOTEL DETAILS
    // ========================================================

    hotelDetails:
      hotelDetailsSchema,


    // ========================================================
    // PARTIAL PAYMENT
    // ========================================================

    partialPayment: {
      type: Boolean,
      default: false
    },

    partialPaymentPercentage: {
      type: Number,
      default: 0
    },

    partialPaymentDueDays: {
      type: Number,
      default: 0
    },

    partialPaymentDueDate: {
      type: Date
    },

    partialAmount: {
      type: Number,
      default: 0
    }

  }, {
    timestamps: true
  });


// ============================================================
// ENSURE ONLY ONE LEAD TRAVELLER
// ============================================================

bookingSchema.pre(
  "save",
  function(next) {

    const leadCount =
      this.travellers.filter(
        t =>
          t.isLeadTraveller
      ).length;


    if (
      leadCount !== 1
    ) {

      return next(
        new Error(
          "There must be exactly one lead traveller per booking."
        )
      );

    }


    next();

  }
);


const Booking =
  Mongoose.model(
    "Booking",
    bookingSchema
  );


module.exports = Booking;