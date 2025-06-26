const dbs = require("mongoose");

const itinerarySchema = dbs.Schema([
  {
    dayNo: Number,
    place: [String],
    dayItinerary: [
      {
        type: {
          type: String,
          required: true,
        },
        iti_id: String,
        title: String,
        details: String,
        description: String,
        duration: String,
      },
    ],
  },
]);

const holidayPackage = dbs.Schema({
  objectType: { type: String, default: "holidays" },
  packageName: String,
  packageDuration: { days: Number, nights: Number },
  themeImg: { filename: String, path: String, mimetype: String },
  selectType: String,
  uniqueId: String,
  packageType: String,
  destinationCity: [String],
  highlights: String,
  status: { type: Boolean, default: false },
  createPilgrimage: { type: Boolean, default: false },
  displayHomepage: { type: Boolean, default: false },
  partialPayment: { type: Boolean, default: false },
  recommendedPackage: { type: Boolean, default: false },
  vehiclePrices: [{ vehicleType: String, price: Number }],
  availableVehicle: [
    {
      vehicleType: String,
      price: Number,
      rate:Number,
      // vehicleCategory: String,
      seatLimit: Number,
      vehicle_id: String,
      brandName: String,
      modelName: String,
    },
  ],
  paymentDueDays: Number,
  partialPaymentPercentage: Number,
  cancellationPolicyType: String,
  roomLimit: Number,
  include: String,
  exclude: String,
  itinerary: [itinerarySchema],
  images: [{ filename: String, path: String, mimetype: String }],
  priceMarkup: Number,
  inflatedPercentage: Number,
  active: Boolean,
  inventry: Number,
  startCity: String,
});

const holidayPackageModel = dbs.model("holidayPackage", holidayPackage);
module.exports = holidayPackageModel;
