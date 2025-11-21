// ------------------------------------------------------------
// Holiday Package Random Seeder (FINAL)
// ------------------------------------------------------------
const mongoose = require("mongoose");
const { HolidayPackage } = require("../models/holidaysPackage");

// MongoDB URL
const MONGO_URI = "mongodb://127.0.0.1:27017/sarvatrah";

// Random Helpers
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Lists
const DESTINATIONS = [
  "Shimla", "Manali", "Dharamshala", "Kullu", "Kufri",
  "Goa", "Mumbai", "Delhi", "Jaipur", "Kerala",
];

const START_CITIES = ["Delhi", "Chandigarh", "Mumbai", "Goa", "Bangalore"];

const PACKAGE_TYPES = [
  "family",
  "honeymoon",
  "adventure",
  "luxury",
  "budget",
  "group",
  "custom",
];

const ACTIVITY_TITLES = [
  "River Rafting",
  "Paragliding",
  "City Walk",
  "Temple Visit",
  "Sunset Point",
  "Trekking Trail",
  "Museum Tour",
];

const ACTIVITY_TYPES = [
  "Sightseeing",
  "Adventure",
  "Leisure",
  "Cultural",
  "Other",
];

// Seeder Function
async function seedHolidayPackages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🔥 Connected to MongoDB");

    // CLEAR OLD DATA
    await HolidayPackage.deleteMany({});
    console.log("🗑 Old holiday packages removed");

    let packages = [];

    for (let i = 1; i <= 50; i++) {
      const destination = rand(DESTINATIONS);
      const days = randomInt(3, 10);
      const nights = days - 1;

      // PRICING LOGIC
      const basePrice = randomInt(8000, 120000);
      const discountType = rand(["none", "percent", "fixed"]);
      let discountValue = 0;

      let finalPrice = basePrice;

      if (discountType === "percent") {
        discountValue = randomInt(5, 30);
        finalPrice = Math.round(basePrice - (basePrice * discountValue) / 100);
      } else if (discountType === "fixed") {
        discountValue = randomInt(1000, 7000);
        finalPrice = basePrice - discountValue;
      }

      // Itinerary generator
      const itinerary = Array.from({ length: days }).map((_, index) => ({
        dayNo: index + 1,
        title: `Day ${index + 1} Activities`,
        subtitle: "Explore attractions",
        description: `Activities for day ${index + 1}`,
        stay: Math.random() > 0.4,
        hotel_id: null,

        state: "Himachal Pradesh",
        city: destination,

        mealsIncluded: ["Breakfast"],

        transport: {
          type: "Private Cab",
          details: "Local sightseeing",
        },

        placesToVisit: [`Place ${randomInt(1, 10)}`],

        // RANDOM ACTIVITIES
        activities: Array.from({ length: randomInt(0, 3) }).map(() => ({
          type: rand(ACTIVITY_TYPES),
          title: rand(ACTIVITY_TITLES),
          description: "Activity description goes here.",
          duration: `${randomInt(1, 5)} hours`,
          image: {
            filename: "activity.jpg",
            path: "/uploads/activity.jpg",
            mimetype: "image/jpeg",
          },
        })),

        notes: "Carry warm clothes",
      }));

      const pkg = {
        objectType: "holidays",
        packageName: `${destination} Tour Package ${i}`,

        packageDuration: { days, nights },

        themeImg: {
          filename: "sample.jpg",
          path: "/uploads/sample.jpg",
          mimetype: "image/jpeg",
        },

        selectType: "domestic",
        uniqueId: `PKG${1000 + i}`,
        packageType: rand(PACKAGE_TYPES),
        destinationCity: [destination],

        highlights: `Enjoy a beautiful tour to ${destination} with scenic experiences.`,

        createPilgrimage: false,
        displayHomepage: Math.random() > 0.7,
        recommendedPackage: Math.random() > 0.5,
        roomLimit: randomInt(10, 50),

        partialPayment: false,
        partialPaymentDueDays: 0,
        partialPaymentPercentage: 0,

        cancellationPolicyType: "non-refundble",
        refundablePercentage: 0,
        refundableDays: 0,

        include: "Breakfast, Sightseeing",
        exclude: "Flight Tickets, Lunch",

        priceMarkup: randomInt(0, 20),
        inflatedPercentage: randomInt(0, 15),

        active: true,
        startCity: rand(START_CITIES),

        images: [
          {
            filename: "img1.jpg",
            path: "/uploads/img1.jpg",
            mimetype: "image/jpeg",
          },
        ],

        itinerary,

        // REAL PRICING FIELDS
        basePrice,
        finalPrice,
        taxes: 0,

        discountType,
        discountValue,

        commissionPercentage: randomInt(0, 20),

        isHotDeal: Math.random() > 0.6,

        vehiclePrices: [],
        availableVehicle: [],

        inventry: 0,
        status: true,
      };

      packages.push(pkg);
    }

    await HolidayPackage.insertMany(packages);
    console.log("✅ 50 Holiday packages generated successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

seedHolidayPackages();
