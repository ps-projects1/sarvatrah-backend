const mongoose = require("mongoose");
const { HolidayPackage } = require("../models/holidaysPackage");

// ✅ UPDATE THIS with your MongoDB connection string
const MONGO_URL = "mongodb://127.0.0.1:27017/test";

const seedHolidayPackage = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected");

    const seedData = {
      _id: "6936855495814a5f3de812d6",
      objectType: "holidays",
      packageName: "test",

      packageDuration: {
        days: 1,
        nights: 0,
      },

      themeImg: {
        filename: "holiday-1765180755694-138169715.png",
        path: "https://sarvatrah-backend.onrender.com/publicdata/holidays/holiday-1765180755694-138169715.png",
        mimetype: "image/png",
      },

      selectType: "international",
      uniqueId: "qwert",
      packageType: "honeymoon",

      destinationCity: ["Balod"],

      availableVehicle: [
        {
          vehicleType: "Sedan",
          price: 17,
          rate: 0,
          seatLimit: 2,
          vehicle_id: "6863f554f4beb93920a5dab0",
          brandName: "test",
          modelName: "test",
          _id: "6936855495814a5f3de812d7",
        },
      ],

      highlights: "test",
      createPilgrimage: false,
      displayHomepage: false,
      recommendedPackage: false,
      roomLimit: 1,
      partialPayment: false,
      partialPaymentDueDays: 0,
      partialPaymentPercentage: 9,
      cancellationPolicyType: "non-refundble",
      refundablePercentage: 0,
      refundableDays: 0,

      include: "test",
      exclude: "test",

      priceMarkup: 3,
      inflatedPercentage: 7,
      active: true,
      startCity: "test",

      images: [
        {
          filename: "holiday-1765180756425-301644269.png",
          path: "https://sarvatrah-backend.onrender.com/public/data/holidays/holiday-1765180756425-301644269.png",
          mimetype: "image/png",
        },
      ],

      itinerary: [
        {
          dayNo: 1,
          title: "test",
          subtitle: "test",
          description: "test",
          stay: false,

          state: {
            _id: "686f501555aed15b4d9f08db",
            name: "Bihar",
            isoCode: "BR",
            country: "686f500f55aed15b4d9f0697",
          },

          city: {
            _id: "686f501555aed15b4d9f08e9",
            name: "Bagaha",
            state: "686f501555aed15b4d9f08db",
            country: "686f500f55aed15b4d9f0697",
          },

          mealsIncluded: ["Lunch"],

          transport: {
            type: "Train",
            details: "test",
          },

          placesToVisit: ["test"],
          activities: [],
          notes: "test",
        },
      ],

      vehiclePrices: [],
    };

    // Remove previous test data (optional)
    await HolidayPackage.deleteOne({ _id: seedData._id });

    // Insert new seed
    await HolidayPackage.create(seedData);

    console.log("Holiday Package test data inserted ✔");
    process.exit();
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
};

seedHolidayPackage();
