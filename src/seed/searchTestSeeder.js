require("dotenv").config();
const connectDB = require("../config/dbConfig");

// MODELS
const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
const { HolidayPackage } = require("../models/holidaysPackage");
const Experience = require("../models/experience");
const Activity = require("../models/activities");
const PilgriPackage = require("../models/pilgriPackage");
const Pricing = require("../models/pricing.model");
const TimingAvailability = require("../models/timing_availablity.model");
const MeetingPoint = require("../models/meetingPickup.model");

async function seedStaticSearchData() {
  try {
    await connectDB();
    console.log("🌱 DB Connected");

    // Clear old data
    await hotelCollection.deleteMany({});
    await vehicleCollection.deleteMany({});
    await HolidayPackage.deleteMany({});
    await Experience.deleteMany({});
    await Activity.deleteMany({});
    await PilgriPackage.deleteMany({});
    await Pricing.deleteMany({});
    await TimingAvailability.deleteMany({});
    await MeetingPoint.deleteMany({});

    console.log("🧹 Cleared existing collections\n");

    // ------------------ HOTELS ------------------
    await hotelCollection.insertMany([
      {
        hotelType: "Deluxe",
        hotelName: "Taj Hotel Mumbai",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        hotelType: "Standard",
        hotelName: "Goa Paradise Resort",
        city: "Goa",
        state: "Goa",
      },
    ]);
    console.log("🏨 Hotels Seeded");

    // ------------------ VEHICLES ------------------
    await vehicleCollection.insertMany([
      {
        vehicleType: "SUV",
        brandName: "Toyota",
        modelName: "Fortuner",
        city: "Mumbai",
        active: true,
        seatLimit: 7,
      },
      {
        vehicleType: "Sedan",
        brandName: "Honda",
        modelName: "City",
        city: "Goa",
        active: true,
        seatLimit: 5,
      },
    ]);
    console.log("🚗 Vehicles Seeded");

    // ------------------ ACTIVITIES ------------------
    await Activity.insertMany([
      {
        packageType: "adventure",
        activityName: "Scuba Diving",
        activityPlace: "Goa",
        targetPlaces: ["Calangute Beach"],
        duration: 2,
        price: 1500,
        description: "Underwater ocean diving experience",
      },
      {
        packageType: "sightseeing",
        activityName: "Mumbai City Tour",
        activityPlace: "Mumbai",
        targetPlaces: ["Gateway of India"],
        duration: 3,
        price: 900,
        description: "Explore Mumbai's historic attractions",
      },
    ]);
    console.log("🎯 Activities Seeded");

    // ------------------ HOLIDAY PACKAGES ------------------
    await HolidayPackage.insertMany([
      {
        packageName: "Goa Family Beach Trip",
        packageDuration: { days: 3, nights: 2 },
        uniqueId: "GOA-1001",
        packageType: "family",
        destinationCity: ["Goa"],
        highlights: "Beaches, nightlife, water sports",
        include: "Hotel + Breakfast + Transfer",
        exclude: "Personal expenses",
        active: true,
        themeImg: {
          filename: "goa.jpg",
          path: "https://picsum.photos/300",
          mimetype: "image/jpeg",
        },
        itinerary: [],
        vehiclePrices: [],
      },
      {
        packageName: "Mumbai Adventure Weekend",
        packageDuration: { days: 2, nights: 1 },
        uniqueId: "MUM-2002",
        packageType: "adventure",
        destinationCity: ["Mumbai"],
        highlights: "Adventure & Nightlife",
        include: "Travel + Food",
        exclude: "Tickets",
        active: true,
        themeImg: {
          filename: "mumbai.jpg",
          path: "https://picsum.photos/300",
          mimetype: "image/jpeg",
        },
        itinerary: [],
        vehiclePrices: [],
      },
    ]);
    console.log("🎒 Holiday Packages Seeded");

    // ------------------ EXPERIENCES ------------------
    await Experience.insertMany([
      {
        title: "Marine Drive Sunset Walk",
        duration: "2 hours",
        location: {
          location: "Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
        },
        description: { short_des: "Peaceful walk near sea" },
        category_theme: { category: ["leisure"], theme: ["outdoor"] },
      },
      {
        title: "Goa Mandovi River Sunset Cruise",
        duration: "1.5 hours",
        location: {
          location: "Mandovi River",
          city: "Goa",
          state: "Goa",
          country: "India",
        },
        description: { short_des: "Dance + Music + Scenic sunset" },
        category_theme: { category: ["adventure"], theme: ["water"] },
      },
    ]);
    console.log("✨ Experiences Seeded");

    // ------------------ PILGRIMAGE PACKAGES ------------------
    await PilgriPackage.insertMany([
      {
        packageName: "Shirdi Sai Darshan",
        packageDuration: { days: 2, night: 1 },
        themeImg: {
          filename: "sai.jpg",
          path: "https://picsum.photos/300",
          mimetype: "image/jpeg",
        },
        include: "Darshan + Hotel + Breakfast",
        exclude: "Prasad cost",
        itinerary: [
          {
            title: "Arrival at Shirdi",
            dayCount: 1,
            place: "Shirdi Temple",
          },
        ],
        availableVehicle: [{ vehicleType: "SUV", price: 2500 }],
      },
      {
        packageName: "Golden Temple Darshan",
        packageDuration: { days: 3, night: 2 },
        themeImg: {
          filename: "golden.jpg",
          path: "https://picsum.photos/300",
          mimetype: "image/jpeg",
        },
        include: "Hotel + Langar + Local Transport",
        exclude: "Train/Flight",
        itinerary: [
          {
            title: "Amritsar Arrival",
            dayCount: 1,
            place: "Golden Temple",
          },
        ],
        availableVehicle: [{ vehicleType: "Sedan", price: 1800 }],
      },
    ]);
    console.log("🛕 Pilgrimage Packages Seeded");

    // ------------------ TIMING AVAILABILITY ------------------
    await TimingAvailability.insertMany([
      { start_time: "09:00 AM", duration: "1:00" },
      { start_time: "02:00 PM", duration: "2:00" },
    ]);
    console.log("⏱ Timing Availability Seeded");

    // ------------------ PRICING ------------------
    await Pricing.insertMany([
      { ticket_category: "adult", price: 500 },
      { ticket_category: "child", price: 250 },
    ]);
    console.log("💰 Pricing Seeded");

    // ------------------ MEETING POINTS ------------------
    await MeetingPoint.insertMany([
      {
        title: "Panaji Bus Stand",
        address: "Panaji, Goa",
        city: "Goa",
        country: "India",
        pickup: "Yes",
        drop: "No",
      },
      {
        title: "Mumbai CST",
        address: "Fort, Mumbai",
        city: "Mumbai",
        country: "India",
        pickup: "Yes",
        drop: "Yes",
      },
    ]);
    console.log("📍 Meeting Points Seeded");

    console.log("\n🎉 ALL Search Test Data Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder Error:", error);
    process.exit(1);
  }
}

seedStaticSearchData();
