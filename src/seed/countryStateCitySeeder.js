const mongoose = require("mongoose");
const connectDB = require("../config/dbConfig");
const Country = require("../models/country");
const State = require("../models/state");
const City = require("../models/city");
const {
  Country: CscCountry,
  State: CscState,
  City: CscCity,
} = require("country-state-city");

const storeCountryStateCity = async () => {
  try {
    await connectDB();

    const countryCode = "IN"; // You can replace with "US", "CA", etc.
    const countryData = CscCountry.getCountryByCode(countryCode);

    // Check if already exists to prevent duplicates
    const existing = await Country.findOne({ isoCode: countryCode });
    if (existing) {
      console.log(`Country ${countryCode} already seeded.`);
      return process.exit(0);
    }

    const country = await Country.create({
      name: countryData.name,
      isoCode: countryData.isoCode,
      phoneCode: countryData.phonecode,
    });

    const states = CscState.getStatesOfCountry(countryCode);
    for (const state of states) {
      const stateDoc = await State.create({
        name: state.name,
        isoCode: state.isoCode,
        country: country._id,
      });

      const cities = CscCity.getCitiesOfState(countryCode, state.isoCode);
      for (const city of cities) {
        await City.create({
          name: city.name,
          state: stateDoc._id,
          country: country._id,
        });
      }

      console.log(`Seeded state: ${state.name}`);
    }

    console.log(
      `✅ ${country.name} with all states and cities seeded successfully`
    );
    process.exit(0);
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
};

storeCountryStateCity();
