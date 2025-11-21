// 🌱 seed-advanture.js
const mongoose = require("mongoose");
const Advanture = require("../models/advanture") // <-- Update path if needed

// 📌 Replace with your DB URL
const MONGO_URL = "mongodb://127.0.0.1:27017/sarvatrah";

const seedAdvanture = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ MongoDB Connected");

    // 🔥 Clear Old Adventure Data
    await Advanture.deleteMany({});
    console.log("🗑 Old advanture data cleared");

    // 🌱 Seed Data
    const advantureData = [
      {
        packageName: "Bungee Jumping Rishikesh",
        packageDuration: "1 Hour",
        themeImg: {
          filename: "bungee.jpg",
          path: "https://picsum.photos/600",
          mimetype: "image/jpeg",
        },
        availableVehicle: [
          { vehicleType: "Jeep", price: 500 },
          { vehicleType: "SUV", price: 900 }
        ],
        groupSize: 5,
        include: ["Safety Gear", "Instructor"],
        exclude: ["Travel Insurance"],
        startLocation: "Rishikesh",
        advantureLocation: "Mohanchatti",
        imgs: [
          { filename: "jump1.jpg", path: "https://picsum.photos/601", mimetype: "image/jpeg" },
          { filename: "jump2.jpg", path: "https://picsum.photos/602", mimetype: "image/jpeg" }
        ],
        discount: "10%",
        price: 3500,
        overview: "Experience India's highest bungee jump in Rishikesh.",
        availableLanguage: ["English", "Hindi"],
        cancellationPolicy: "24 hours prior",
        highlight: "83m Bungee Jump Platform",
        endpoint: "Riverside",
        mapLink: "https://maps.google.com/",
        unEligibility: { age: [0, 14], diseases: ["Heart Problem"] },
        pickUpAndDrop: true,
        pickUpOnly: false,
        dropOnly: false,
        pickUpLocation: "Rishikesh Bus Stand",
        dropLocation: "Jumpin Heights",
        availableSlot: 20,
        ageTypes: {
          adult: true,
          children: false,
          senior: false,
        },
        age: {
          adult: "18-50",
          children: "",
          senior: "",
        },
      },

      {
        packageName: "Sky Cycling Manali",
        packageDuration: "2 Hours",
        themeImg: {
          filename: "skycycle.jpg",
          path: "https://picsum.photos/650",
          mimetype: "image/jpeg",
        },
        availableVehicle: [
          { vehicleType: "Bike", price: 400 },
          { vehicleType: "Taxi", price: 800 }
        ],
        groupSize: 4,
        include: ["Safety Gear", "Instructor"],
        exclude: ["Food"],
        startLocation: "Manali",
        advantureLocation: "Solang Valley",
        imgs: [
          { filename: "cycle1.jpg", path: "https://picsum.photos/651", mimetype: "image/jpeg" },
          { filename: "cycle2.jpg", path: "httpsum.photos/652", mimetype: "image/jpeg" }
        ],
        discount: "15%",
        price: 1800,
        overview: "Cycle in the sky across Solang Valley on a suspended rope.",
        availableLanguage: ["English", "Hindi"],
        cancellationPolicy: "48 hours prior",
        highlight: "High-altitude Sky Cycling",
        endpoint: "Solang Base",
        mapLink: "https://maps.google.com/",
        unEligibility: { age: [0, 10], diseases: ["Vertigo"] },
        pickUpAndDrop: false,
        pickUpOnly: true,
        dropOnly: false,
        pickUpLocation: "Manali Mall Road",
        dropLocation: "",
        availableSlot: 30,
        ageTypes: {
          adult: true,
          children: true,
          senior: false,
        },
        age: {
          adult: "18-45",
          children: "10-17",
          senior: "",
        },
      }
    ];

    // 🌱 Insert Data
    await Advanture.insertMany(advantureData);
    console.log("🎉 Advanture seeding completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedAdvanture();
