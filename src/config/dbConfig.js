require("dotenv").config();
const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("connected");
  } catch (e) {
    console.log("error in db connection " + e);
  }
};

// mongodb+srv://sarvatrah23:Sarvatrah%402023@sarvatrah.2xrxc8c.mongodb.net/sarvatrah

module.exports = dbConnection;
