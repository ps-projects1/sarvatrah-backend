const dbs = require("mongoose");

// Activity Schema (extracted for better organization)
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
  },
  { _id: false }
); // Prevent automatic ID generation for subdocuments

// Transport Schema
const transportSchema = new dbs.Schema(
  {
    type: {
      type: String,
      enum: ["Private Cab", "Flight", "Train", "Bus", "Cruise", "Other"],
      required: true,
    },
    details: String,
  },
  { _id: false }
);

// Day Itinerary Schema
const dayItinerarySchema = new dbs.Schema(
  {
    dayNo: { type: Number, required: true, min: 1 },
    title: String,
    subtitle: String,
    description: { type: String, required: true },
    stay: { type: Boolean, default: false },
    hotel_id : {
      type: dbs.Schema.Types.ObjectId,
      ref: "Hotel",
    },
    state: {
  type: {
    _id: String,
    name: String,
    isoCode: String,
    country: String
  },
  required: false
},

city: {
  type: {
    _id: String,
    name: String,
    state: String,
    country: String
  },
  required: false
},

    mealsIncluded: [
      {
        type: String,
        enum: ["Breakfast", "Lunch", "Dinner", "Snacks", "Other"],
      },
    ],
    transport: transportSchema,
    placesToVisit: [String],
    activities: [activitySchema],
    hotels: [
      {
        hotel_id: {
          type: dbs.Schema.Types.ObjectId,
          ref: "Hotel",
        },
        hotelName: String,
        state: String,
        city: String,
        pricePerNight: Number,
        starRating: String,
        address: String,
      },
      { _id: false }
    ],
    notes: String,
  },
  { _id: false }
);

// Vehicle Price Schema
const vehiclePriceSchema = new dbs.Schema(
  {
    vehicle_id: { type: String, required: true },
    vehicleType: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Image Schema
const imageSchema = new dbs.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
  },
  { _id: false }
);

// Holiday Package Schema
const holidayPackageSchema = new dbs.Schema(
  {
    objectType: {
      type: String,
      default: "holidays",
      enum: ["holidays", "pilgrimage", "special"],
    },
    packageName: { type: String, required: true, trim: true },
    packageDuration: {
      days: { type: Number, required: true, min: 1 },
      nights: { type: Number, required: true, min: 0 },
    },
    themeImg: imageSchema,
    selectType: {
      type: String,
      enum: ["domestic", "international", "both"],
    },
    uniqueId: { type: String, required: true, unique: true },
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
      ],
      required: true,
    },
    destinationCity: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    availableVehicle: [
  {
    vehicleType: { type: String, required: true },
    price: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    seatLimit: { type: Number, default: 0 },
    vehicle_id: { type: String },
    brandName: String,
    modelName: String
  }
],

    highlights: { type: String, required: true },
    createPilgrimage: { type: Boolean, default: false },
    displayHomepage: { type: Boolean, default: false },
    recommendedPackage: { type: Boolean, default: false },
    roomLimit: { type: Number, min: 1 },
    partialPayment: { type: Boolean, default: false },
    partialPaymentDueDays: { type: Number, min: 0, default: 0 },
    partialPaymentPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    cancellationPolicyType: {
      type: String,
      enum: ["refundble", "non-refundble"],
      default: "non-refundble",
    },
    refundablePercentage: { type: Number, default: 0 },
    refundableDays: { type: Number, default: 0 },
    refundableTerms: { type: String, default: "" },
    include: String,
    exclude: String,
    basePrice: { type: Number, default: 0, min: 0 },
    priceMarkup: { type: Number, default: 0 },
    inflatedPercentage: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    startCity: { type: String, trim: true },
    images: [imageSchema],
    itinerary: [dayItinerarySchema],
    vehiclePrices: [vehiclePriceSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Indexes for better query performance
holidayPackageSchema.index({ packageName: 1 });
holidayPackageSchema.index({ destinationCity: 1 });
holidayPackageSchema.index({ packageType: 1 });
holidayPackageSchema.index({ status: 1 });

const HolidayPackage = dbs.model("HolidayPackage", holidayPackageSchema);
module.exports = { HolidayPackage };
