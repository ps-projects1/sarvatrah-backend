// ------------------------------------------------------------
// Hotel Random Seeder (FINAL MATCHING YOUR PACKAGE SEEDER STYLE)
// ------------------------------------------------------------
const mongoose = require("mongoose");
const { hotelCollection } = require("../models/hotel");

// MongoDB URL
const MONGO_URI = "mongodb://127.0.0.1:27017/sarvatrah";

// Helpers
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const CITIES = [
  "Manali",
  "Shimla",
  "Kullu",
  "Kasol",
  "Dharamshala",
  "Kufri",
  "Dalhousie",
  "Goa",
  "Jaipur",
];

const FACILITIES = [
  "WiFi",
  "Parking",
  "Heater",
  "Restaurant",
  "Room Service",
  "Laundry",
  "Balcony",
];

const ROOM_TYPES = ["Deluxe Room", "Super Deluxe Room", "Premium Room"];

// Room images
const roomImage = (id) => ({
  filename: `room_${id}.jpg`,
  path: `/uploads/hotels/rooms/room_${id}.jpg`,
  mimetype: "image/jpeg",
});

// Hotel images
const hotelImage = (id) => ({
  filename: `hotel_${id}.jpg`,
  path: `/uploads/hotels/hotel_${id}.jpg`,
  mimetype: "image/jpeg",
});

// ------------------------------------------------------------
// GENERATE ROOM BLOCK
// ------------------------------------------------------------
function generateRoom(i) {
  return {
    roomType: rand(ROOM_TYPES),

    inventory: randomInt(5, 20),

    adultPrice: randomInt(1200, 3000),
    extraAdultPrice: randomInt(500, 900),
    extraChildPrice: randomInt(300, 700),

    amenities: rand(FACILITIES).split(" "), // random facility

    roomImages: [roomImage(i), roomImage(i + 1)],

    roomDescription: `Comfortable ${rand(ROOM_TYPES)} with hill view.`,

    maxAdults: 3,
    maxChildren: 2,
    maxTotalOccupancy: 4,

    availabilityCalendar: Array.from({ length: 30 }).map((_, dayIndex) => ({
      date: new Date(Date.now() + dayIndex * 24 * 60 * 60 * 1000),
      available: randomInt(1, 10),
    })),

    bookings: [],
  };
}

// ------------------------------------------------------------
// MAIN Seeder
// ------------------------------------------------------------
async function seedHotels() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🔥 Connected to MongoDB for Hotel Seeder");

    // DELETE OLD DATA
    await hotelCollection.deleteMany({});
    console.log("🗑 Old hotels removed");

    let hotels = [];

    for (let i = 1; i <= 30; i++) {
      const city = rand(CITIES);

      hotels.push({
        objectType: "hotel",
        hotelType: "Deluxe",
        hotelName: `${city} Hills Resort ${i}`,

        state: "Himachal Pradesh",
        city,
        pincode: "175101",

        phoneNumber: "9876543210",
        email: `hotel${i}@gmail.com`,
        contactPerson: "Manager",

        descriptions: "Beautiful hillside property with luxury stay.",

        hotelImages: [hotelImage(i), hotelImage(i + 100)],

        hotelFacilities: [
          rand(FACILITIES),
          rand(FACILITIES),
          rand(FACILITIES),
        ],

        rooms: [generateRoom(i), generateRoom(i + 50)],

        contractDate: {
          start: "2025-01-01",
          end: "2026-01-01",
        },

        blackout: {
          start: "2025-12-20",
          end: "2026-01-05",
        },

        imgs: [hotelImage(i + 200)],

        active: true,
        defaultSelected: false,

        bookings: [],
      });
    }

    await hotelCollection.insertMany(hotels);

    console.log("✅ 30 Hotels generated successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Hotel Seeder Error:", err);
    process.exit(1);
  }
}

seedHotels();
