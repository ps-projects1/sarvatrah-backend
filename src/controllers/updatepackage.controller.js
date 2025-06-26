// Helper function to find and update the itinerary
const packageCollection = require("../models/holidaysPackage");

const findAndUpdateItinerary = async (packageId, updateFunction) => {
    const package = await packageCollection.findById(packageId);
  
    if (!package) {
      throw new Error("Package not found");
    }
  
    const updatedItinerary = await updateFunction(package.itinerary);
  
    package.itinerary = updatedItinerary;
    await package.save();
  
    return package;
  };

  module.exports ={findAndUpdateItinerary};