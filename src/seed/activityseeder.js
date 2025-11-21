// 🌱 seed-activities.js
const mongoose = require("mongoose");
const activityCollection = require("../models/activityPackage");

// 📌 Replace with your DB URL
const MONGO_URL = "mongodb://127.0.0.1:27017/sarvatrah";

const seedActivities = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ MongoDB Connected");

    // 🔥 CLEAR OLD DATA
    await activityCollection.deleteMany({});
    console.log("🗑 Old activity data cleared");

    // 🌱 SAMPLE ACTIVITY LIST
    const activityData = [
      {
        packageName: "River Rafting Adventure",
        packageDuration: "3 Hours",
        themeImg: {
          filename: "rafting.jpg",
          path: "https://picsum.photos/500",
          mimetype: "image/jpeg",
        },
        availableVehicle: [
          { vehicleType: "Jeep", price: 1200 },
          { vehicleType: "SUV", price: 1800 }
        ],
        groupSize: 10,
        include: ["Guide", "Safety Kit"],
        exclude: ["Meals"],
        startLocation: "Rishikesh",
        activityLocation: "Shivpuri",
        discount: "10%",
        price: 999,
        overview:
          "Experience thrilling white-water river rafting in Rishikesh.",
        availableLanguage: ["English", "Hindi"],
        cancellationPolicy: "24 hours prior",
        highlight: "Grade 3 Rapids",
        mapLink: "https://maps.google.com/",
        unEligibility: { age: [0, 12], diseases: ["Asthma"] },
        availableSlot: 50,
        pickUpAndDrop: true,
        pickUpOnly: false,
        dropOnly: false,
        pickUpLocation: "Rishikesh Bus Stand",
        dropLocation: "Rishikesh Bus Stand",
        age: {
          adult: "18-50",
          children: "12-17",
          senior: "50+"
        },
      },

      {
        packageName: "Paragliding Experience",
        packageDuration: "15 Minutes",
        themeImg: {
          filename: "paragliding.jpg",
          path: "https://picsum.photos/501",
          mimetype: "image/jpeg",
        },
        availableVehicle: [
          { vehicleType: "Taxi", price: 800 },
          { vehicleType: "Bike", price: 400 }
        ],
        groupSize: 2,
        include: ["Instructor", "Safety Gear"],
        exclude: ["Travel Insurance"],
        startLocation: "Bir Billing",
        activityLocation: "Billing Cliff",
        discount: "5%",
        price: 2500,
        overview: "Fly high above the mountains in Bir Billing.",
        availableLanguage: ["English", "Hindi", "Punjabi"],
        cancellationPolicy: "48 hours prior",
        highlight: "Best paragliding location in India",
        mapLink: "https://maps.google.com/",
        unEligibility: { age: [0, 14], diseases: ["Heart Issue"] },
        availableSlot: 20,
        pickUpAndDrop: false,
        pickUpOnly: true,
        dropOnly: false,
        pickUpLocation: "Bir Market",
        dropLocation: "",
        age: {
          adult: "18-45",
          children: "14-17",
          senior: "",
        },
      }
    ];

    // 🌱 INSERT DATA
    await activityCollection.insertMany(activityData);
    console.log("🎉 Activity seeding completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedActivities();
