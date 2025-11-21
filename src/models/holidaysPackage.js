// models/HolidayPackage.js
const dbs = require("mongoose");

/* ------------------------------------------------------------------
   ACTIVITY SCHEMA
------------------------------------------------------------------ */
const activitySchema = new dbs.Schema(
  {
    type: {
      type: String,
      enum: ["Sightseeing", "Adventure", "Leisure", "Cultural", "Other"],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    duration: String,
    image: {
      filename: String,
      path: String,
      mimetype: String,
    },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   TRANSPORT SCHEMA (existing)
------------------------------------------------------------------ */
const transportSchema = new dbs.Schema(
  {
    type: {
      type: String,
      enum: ["Private Cab", "Flight", "Train", "Bus", "Cruise", "Other"],
      required: true,
    },
    details: String,
    vehicle_id: String,
    serviceProvider: String,
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   ⭐ FULL VEHICLE DETAILS + IMAGES
------------------------------------------------------------------ */
const vehicleFullSchema = new dbs.Schema(
  {
    vehicle_id: String,
    vehicleType: String,
    brandName: String,
    modelName: String,
    seats: Number,
    baggageCapacity: String,
    facilities: [String],
    price: Number,
    description: String,

    /* ⭐ VEHICLE IMAGES */
    images: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ],
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   ⭐ HOTEL OPTIONS FOR EACH DAY + IMAGES
------------------------------------------------------------------ */
const hotelOptionSchema = new dbs.Schema(
  {
    hotel_id: { type: dbs.Schema.Types.ObjectId, ref: "hotels" },
    hotelName: String,
    roomType: String,

    /* ROOM IMAGES */
    images: [
      {
        filename: String,
        path: String,
        mimetype: String,
      },
    ],

    price: Number,
    rating: Number,
    facilities: [String],
    roomDescription: String,

    /* ⭐ THE HOTEL IMAGES */
    hotelImages: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ],

    /* ⭐ THE ROOM IMAGES */
    roomImages: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ],
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   DAY ITINERARY (ONLY ADDING KEYS)
------------------------------------------------------------------ */
const dayItinerarySchema = new dbs.Schema(
  {
    dayNo: { type: Number, required: true },
    title: String,
    subtitle: String,
    description: { type: String, required: true },
    stay: { type: Boolean, default: false },

    hotel_id: {
      type: dbs.Schema.Types.ObjectId,
      ref: "hotels",
    },

    state: String,
    city: String,

    mealsIncluded: [
      {
        type: String,
        enum: ["Breakfast", "Lunch", "Dinner", "Snacks", "Other"],
      },
    ],

    transport: transportSchema,
    placesToVisit: [String],
    activities: [activitySchema],
    notes: String,
    exactDate: { type: Date },

    /* ⭐ ADDED ROUTE SUPPORT */
    fromCity: String,
    toCity: String,

    /* ⭐ UPDATED VEHICLE SUPPORT */
    defaultVehicleForDay: vehicleFullSchema,
    availableVehiclesForDay: [vehicleFullSchema],
    upgradedVehicleOptions: [vehicleFullSchema],

    /* ⭐ UPDATED HOTEL SUPPORT */
    defaultHotelDetails: hotelOptionSchema,
    hotelOptions: [hotelOptionSchema],

    alternateHotel_ids: [
      {
        type: dbs.Schema.Types.ObjectId,
        ref: "hotels",
      },
    ],
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   VEHICLE PRICE SCHEMA (existing)
------------------------------------------------------------------ */
const vehiclePriceSchema = new dbs.Schema(
  {
    vehicle_id: { type: String, required: true },
    vehicleType: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   IMAGE SCHEMA (existing)
------------------------------------------------------------------ */
const imageSchema = new dbs.Schema(
  {
    filename: String,
    path: String,
    mimetype: String,
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   ⭐ FINAL HOLIDAY PACKAGE SCHEMA — ONLY ADDITIONS
------------------------------------------------------------------ */
const holidayPackageSchema = new dbs.Schema(
  {
    objectType: { type: String, default: "holidays" },

    packageName: { type: String, required: true },
    uniqueId: { type: String, required: true, unique: true },

    packageDuration: {
      days: Number,
      nights: Number,
    },

    themeImg: imageSchema,
    images: [imageSchema],

    /* ⭐ NEW PACKAGE GALLERY IMAGES */
    galleryImages: [
      {
        filename: String,
        path: String,
        mimetype: String,
        _id: false,
      },
    ],

    selectType: {
      type: String,
      enum: ["domestic", "international", "both"],
    },

    packageType: {
      type: String,
      enum: [
        "family",
        "honeymoon",
        "adventure",
        "luxury",
        "budget",
        "group",
        "custom",
        "couple",
        "hot-deals",
      ],
      required: true,
    },

    destinationCity: [String],
    highlights: String,
    startCity: String,

    itinerary: [dayItinerarySchema],

    /* ⭐ FULL VEHICLES */
    availableVehicle: [vehicleFullSchema],

    vehiclePrices: [vehiclePriceSchema],

    /* ⭐ DEPARTURES - keep but seats unused */
    departures: [
      {
        startDate: Date,
        endDate: Date,
        seatsAvailable: Number,
        inventory: Number,
        basePrice: Number,
        vehiclesAvailable: [vehicleFullSchema],
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    routes: [
      {
        from: String,
        to: String,
        order: Number,
        _id: false,
      },
    ],

    /* EXISTING PRICE SETTINGS */
    priceMarkup: Number,
    inflatedPercentage: Number,
    basePrice: Number,
    finalPrice: Number,
    taxes: Number,

    discountType: {
      type: String,
      enum: ["none", "percent", "fixed"],
      default: "none",
    },
    discountValue: Number,

    commissionPercentage: Number,
    status: { type: Boolean, default: true },
    active: { type: Boolean, default: false },

    maxAdults: Number,
    maxChildren: Number,
    paymentDueDays: Number,
    inventry: Number,
    isHotDeal: Boolean,
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------
   INDEXES
------------------------------------------------------------------ */
holidayPackageSchema.index({ packageName: 1 });
holidayPackageSchema.index({ destinationCity: 1 });
holidayPackageSchema.index({ packageType: 1 });
holidayPackageSchema.index({ status: 1 });

const HolidayPackage = dbs.model("HolidayPackage", holidayPackageSchema);
module.exports = { HolidayPackage };
