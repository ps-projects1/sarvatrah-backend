const Booking = require("../../models/booking");

const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .populate("holidayPackageId")
      .populate("hotelId")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: bookings,
      message: "Customer bookings fetched",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
      },
    });
  }
};

module.exports = getCustomerBookings;
