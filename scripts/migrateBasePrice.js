

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database");

    const db = mongoose.connection.db;
    const collection = db.collection("holidaypackages");

    const result = await collection.updateMany(
      { basePrice: { $exists: false } },
      { $set: { basePrice: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} packages with basePrice: 0`);

    const result2 = await collection.updateMany(
      { basePrice: null },
      { $set: { basePrice: 0 } }
    );

    console.log(`Updated ${result2.modifiedCount} packages with null basePrice to 0`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

migrate();
