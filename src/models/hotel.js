// models/Hotel.js
const dbs = require("mongoose");

/* --------------------------------------------------------------
   CATEGORY SCHEMA (UNCHANGED)
-------------------------------------------------------------- */
const categorySchema = dbs.Schema({
  category: {
    type: String,
    enum: ["standard", "deluxe", "super deluxe"],
  },
  name: String,
});

/* --------------------------------------------------------------
   EXISTING AVAILABILITY RANGE (UNCHANGED)
-------------------------------------------------------------- */
const availabilitySchema = dbs.Schema(
  {
    startDate: String,
    endDate: String,
  },
  { _id: false }
);

/* --------------------------------------------------------------
   ⭐ BOOKING SCHEMA (used inside rooms + hotel log)
-------------------------------------------------------------- */
const bookingSchema = dbs.Schema(
  {
    packageId: { type: dbs.Schema.Types.ObjectId, ref: "HolidayPackage" },

    roomType: String,

    startDate: { type: Date },
    endDate: { type: Date },

    adults: { type: Number, default: 0 },
    children: { type: Number, default: 0 },

    quantity: { type: Number, default: 1 },

    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* --------------------------------------------------------------
   ROOM SCHEMA (SUPPORTS ROOM IMAGES, PRICING, AVAILABILITY)
-------------------------------------------------------------- */
const roomSchema = dbs.Schema(
  {
    roomType: String,
    inventory: Number,

    /* child prices */
    child: {
      childWithBedPrice: Number,
      childWithoutBedPrice: Number,
    },

    occupancyRates: [Number],
    amenities: [String],
    duration: [availabilitySchema],

    /* --------------------------------------------------------------
       ⭐ DATE-WISE AVAILABILITY (used for "is room available?")
    -------------------------------------------------------------- */
    availabilityCalendar: [
      {
        date: { type: Date },        // ⭐ NEW
        available: { type: Number }, // ⭐ NEW
        _id: false,
      },
    ],

    /* ROOM LEVEL BOOKING RECORDS */
    bookings: [bookingSchema],

    /* --------------------------------------------------------------
       ⭐ ROOM PRICING (used when calculating package cost/day)
    -------------------------------------------------------------- */
    adultPrice: { type: Number, default: 0 },        // ⭐ NEW
    extraAdultPrice: { type: Number, default: 0 },   // ⭐ NEW
    extraChildPrice: { type: Number, default: 0 },   // ⭐ NEW

    /* --------------------------------------------------------------
       ⭐ ROOM IMAGES (used in itinerary.hotelOptions)
    -------------------------------------------------------------- */
    roomImages: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ], // ⭐ NEW

    roomDescription: { type: String }, // ⭐ NEW

    /* --------------------------------------------------------------
       ⭐ OCCUPANCY RULES
    -------------------------------------------------------------- */
    maxAdults: { type: Number, default: 3 },        // ⭐ NEW
    maxChildren: { type: Number, default: 2 },      // ⭐ NEW
    maxTotalOccupancy: { type: Number, default: 4 }, // ⭐ NEW
  },
  { _id: false }
);

/* --------------------------------------------------------------
   MAIN HOTEL SCHEMA
-------------------------------------------------------------- */
const hotelSchema = dbs.Schema(
  {
    objectType: { type: String, default: "hotel" },

    hotelType: { type: String, required: true },
    hotelName: { type: String, required: true },

    /* FULL ROOM SCHEMA */
    rooms: [roomSchema],

    address: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    contactPerson: { type: String },

    descriptions: { type: String },

    /* --------------------------------------------------------------
       ⭐ FULL HOTEL IMAGES (used in itinerary.defaultHotelDetails)
    -------------------------------------------------------------- */
    hotelImages: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ], // ⭐ NEW

    /* --------------------------------------------------------------
       ⭐ HOTEL FACILITIES
    -------------------------------------------------------------- */
    hotelFacilities: [String], // ⭐ NEW

    /* CONTRACT + BLACKOUTS */
    contractDate: {
      start: { type: String },
      end: { type: String },
    },

    blackout: {
      start: { type: String },
      end: { type: String },
    },

    /* OLD IMAGE FIELD — kept for backward compatibility */
    imgs: [
      {
        filename: { type: String },
        path: { type: String },
        mimetype: { type: String },
      },
      { _id: false },
    ],

    active: { type: Boolean, default: false },
    defaultSelected: { type: Boolean, default: false },

    /* --------------------------------------------------------------
       ⭐ FULL HOTEL BOOKING LOG (Used for analytics, fallback)
    -------------------------------------------------------------- */
    bookings: [
      {
        packageId: { type: dbs.Schema.Types.ObjectId, ref: "HolidayPackage" },
        roomType: String,
        startDate: { type: Date },
        endDate: { type: Date },
        adults: { type: Number, default: 0 },
        children: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ], // ⭐ NEW
  },
  {
    timestamps: true,
  }
);

/* --------------------------------------------------------------
   EXPORT
-------------------------------------------------------------- */
const Category = dbs.model("category", categorySchema);
const hotelCollection = dbs.model("hotels", hotelSchema);

module.exports = { hotelCollection, Category };
