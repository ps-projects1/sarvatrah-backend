const Booking = require("../../models/Booking");
const holidayPackageModel = require("../../models/holidaysPackage");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const User = require("../../models/user");

const fetchBooking = async (req, res) => {
  try {
    const bookingData = await Booking.find({});

    return res.status(200).json({
      message: "Bookings fetched successfully",
      data: bookingData,
    });
  } catch (error) {
    console.error("Error fetch booking:", error);
    return res
      .status(500)
      .json({ message: "Error fetch booking", error: error.message });
  }
};
module.exports = { fetchBooking };
