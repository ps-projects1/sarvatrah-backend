// Seeder Script to Insert Hotel, Vehicle, and Holiday Package
// Run: node seed.js

const mongoose = require("mongoose");
const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
const { HolidayPackage } = require("../models/holidaysPackage");

mongoose.connect("mongodb://127.0.0.1:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seed() {
  try {
    console.log("Seeding started...");

    // 1️⃣ Create Hotel
    const hotel = await hotelCollection.create({
      hotelType: "3-Star",
      hotelName: "Sunrise Resort",
      rooms: [
        {
          roomType: "Deluxe Room",
          inventory: 10,
          child: {
            childWithBedPrice: 800,
            childWithoutBedPrice: 400,
          },
          occupancyRates: [2000, 3000, 4000],
          amenities: ["AC", "WiFi", "TV"],
          duration: [{ startDate: "2025-01-10", endDate: "2025-01-20" }],
        },
      ],
      address: "Beach Road",
      city: "Goa",
      state: "Goa",
      pincode: "403001",
      phoneNumber: "9876543210",
      email: "info@sunrise.com",
      contactPerson: "Manager",
      descriptions: "Beautiful resort near beach.",
      active: true,
    });
    console.log("Hotel ID:", hotel._id.toString());

    // 2️⃣ Create Vehicle
    const vehicle = await vehicleCollection.create({
      vehicleType: "SUV",
      brandName: "Toyota",
      modelName: "Innova Crysta",
      inventory: 5,
      seatLimit: 7,
      luggageCapacity: 3,
      rate: 3500,
      facilties: ["AC", "Music System"],
      active: true,
      vehicleCategory: "Premium",
      city: "Goa",
    });
    console.log("Vehicle ID:", vehicle._id.toString());

    // 3️⃣ Create Holiday Package
    const holiday = await HolidayPackage.create({
      objectType: "holidays",
      packageName: "Goa Beach Paradise",
      packageDuration: { days: 3, nights: 2 },
      themeImg: {
        filename: "goa.jpg",
        path: "/uploads/goa.jpg",
        mimetype: "image/jpeg",
      },
      selectType: "domestic",
      uniqueId: "GOA12345",
      packageType: "family",
      destinationCity: ["Goa"],
      availableVehicle: [
        {
          vehicleType: vehicle.vehicleType,
          price: 3500,
          rate: 100,
          seatLimit: 7,
          vehicle_id: vehicle._id.toString(),
          brandName: vehicle.brandName,
          modelName: vehicle.modelName,
        },
      ],
      highlights: "Beach fun, nightlife, cruise ride",
      include: "Breakfast, Accommodation, Transfers",
      exclude: "Flights",
      images: [
        {
          filename: "beach.jpg",
          path: "/uploads/beach.jpg",
          mimetype: "image/jpeg",
        },
      ],
      startCity: "Mumbai",
      itinerary: [
        {
          dayNo: 1,
          title: "Arrival in Goa",
          description: "Check-in and enjoy the beach.",
          stay: true,
          hotel_id: hotel._id,
          mealsIncluded: ["Dinner"],
          placesToVisit: ["Calangute Beach"],
        },
      ],
      vehiclePrices: [
        {
          vehicle_id: vehicle._id.toString(),
          vehicleType: vehicle.vehicleType,
          price: 3500,
        },
      ],
      active: true,
    });

    console.log("Holiday Package ID:", holiday._id.toString());

    console.log("\nSeeder completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
