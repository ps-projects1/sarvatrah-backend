require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

// DB CONFIG
const connectDB = require("../config/dbConfig");

// MODELS
const Country = require("../models/country");
const State = require("../models/state");
const City = require("../models/city");
const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");
const { HolidayPackage } = require("../models/holidaysPackage");

// CSC Library
const {
  Country: CscCountry,
  State: CscState,
  City: CscCity,
} = require("country-state-city");

async function seed() {
  try {
    await connectDB();
    console.log("🌿 MongoDB Connected");

    console.log("\n🗑 Clearing old data...");
    await Country.deleteMany({});
    await State.deleteMany({});
    await City.deleteMany({});
    await hotelCollection.deleteMany({});
    await vehicleCollection.deleteMany({});
    await HolidayPackage.deleteMany({});

    // ---------------------------------------------------------
    // 0. Seed Country (India)
    // ---------------------------------------------------------
    console.log("\n🌎 Seeding Country India...");
    const countryCode = "IN";
    const countryData = CscCountry.getCountryByCode(countryCode);

    const country = await Country.create({
      name: countryData.name,
      isoCode: countryData.isoCode,
      phoneCode: countryData.phonecode,
    });

    // ---------------------------------------------------------
    // 1. Seed States
    // ---------------------------------------------------------
    console.log("\n📍 Seeding States...");
    const cscStates = CscState.getStatesOfCountry(countryCode);
    const stateDocs = [];

    for (const st of cscStates) {
      const s = await State.create({
        name: st.name,
        isoCode: st.isoCode,
        country: country._id,
      });

      stateDocs.push(s);
    }

    // ---------------------------------------------------------
    // 2. Seed Cities
    // ---------------------------------------------------------
    console.log("\n🏙 Seeding Cities...");
    const cityDocs = [];

    for (const st of stateDocs) {
      const cscCities = CscCity.getCitiesOfState(countryCode, st.isoCode);

      for (const ct of cscCities) {
        const c = await City.create({
          name: ct.name,
          state: st._id,
          country: country._id,
        });

        cityDocs.push(c);
      }
    }

    // ---------------------------------------------------------
    // 3. Seed Hotels
    // ---------------------------------------------------------
    console.log("\n🏨 Seeding Hotels...");
    const hotelDocs = [];

    for (let i = 0; i < 10; i++) {
      const city = faker.helpers.arrayElement(cityDocs);

      const hotel = await hotelCollection.create({
        objectType: "hotel",
        hotelType: faker.helpers.arrayElement(["Standard", "Deluxe", "Premium"]),
        hotelName: faker.company.name(),
        city: city.name,
        state: stateDocs.find((s) => s._id.equals(city.state)).name,
        address: faker.location.streetAddress(),
        pincode: faker.location.zipCode(),
        phoneNumber: faker.phone.number(),
        imgs: [],
        rooms: [
          {
            roomType: "Standard",
            inventory: faker.number.int({ min: 1, max: 10 }),
            occupancyRates: [2000, 2500, 3000],
            child: { childWithBedPrice: 800, childWithoutBedPrice: 500 },
            amenities: ["TV", "WiFi", "AC"],
            duration: [
              {
                startDate: "2025-01-01",
                endDate: "2025-12-31",
              },
            ],
          },
        ],
      });

      hotelDocs.push(hotel);
    }

    // ---------------------------------------------------------
    // 4. Seed Vehicles
    // ---------------------------------------------------------
    console.log("\n🚗 Seeding Vehicles...");
    const vehicleDocs = [];

    for (let i = 0; i < 10; i++) {
      const city = faker.helpers.arrayElement(cityDocs);

      const vehicle = await vehicleCollection.create({
        vehicleType: faker.helpers.arrayElement(["SUV", "Sedan", "Hatchback"]),
        brandName: faker.vehicle.manufacturer(),
        modelName: faker.vehicle.model(),
        inventory: faker.number.int({ min: 1, max: 10 }),
        seatLimit: faker.helpers.arrayElement([4, 6, 7]),
        luggageCapacity: faker.helpers.arrayElement([2, 3, 4]),
        rate: faker.number.int({ min: 1500, max: 5000 }),
        city: city.name,
        active: true,
        vehicleCategory: faker.helpers.arrayElement(["Basic", "Premium"]),
      });

      vehicleDocs.push(vehicle);
    }

    // ---------------------------------------------------------
    // 5. Seed Holiday Packages
    // ---------------------------------------------------------
    console.log("\n🎒 Seeding Holiday Packages...");
    for (let i = 0; i < 8; i++) {
      const city = faker.helpers.arrayElement(cityDocs);

      await HolidayPackage.create({
        packageName: faker.lorem.words(3),
        packageDuration: {
          days: faker.number.int({ min: 2, max: 7 }),
          nights: faker.number.int({ min: 1, max: 6 }),
        },
        themeImg: {
          filename: "demo.jpg",
          path: "https://picsum.photos/300",
          mimetype: "image/jpeg",
        },
        uniqueId: faker.string.uuid(),
        packageType: faker.helpers.arrayElement([
          "family",
          "honeymoon",
          "adventure",
        ]),
        destinationCity: [city.name],
        highlights: faker.lorem.sentence(),
        include: "Flights, Hotels, Meals Included",
        exclude: "Personal Expenses",
        active: true,
        priceMarkup: faker.number.int({ min: 5, max: 20 }),

        availableVehicle: vehicleDocs.slice(0, 3).map((v) => ({
          vehicleType: v.vehicleType,
          price: v.rate,
          vehicleCategory: v.vehicleCategory,
          seatLimit: v.seatLimit,
        })),

        itinerary: [
          {
            dayNo: 1,
            title: "Arrival & Check-in",
            description: "Relax and explore the nearby area.",
            stay: true,
            hotel_id: faker.helpers.arrayElement(hotelDocs)._id,
            mealsIncluded: ["Dinner"],
            placesToVisit: ["Local Market"],
            activities: [
              {
                type: "Sightseeing",
                title: "City Tour",
                duration: "2 hours",
                description: "Explore popular attractions",
                image: {
                  filename: "act.jpg",
                  path: "https://picsum.photos/200",
                  mimetype: "image/jpeg",
                },
              },
            ],
          },
        ],

        vehiclePrices: [],
      });
    }

    console.log("\n🎉 Seeder Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder Error:", error);
    process.exit(1);
  }
}

seed();
