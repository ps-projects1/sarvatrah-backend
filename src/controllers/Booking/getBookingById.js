const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * GET /api/bookings/:id
 * Get single booking details
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    /* =====================
       VALIDATE BOOKING ID
    ===================== */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    /* =====================
       FETCH BOOKING
    ===================== */
    const booking = await Booking.findById(id)
      .populate("user", "name email")
      .populate("holidayPackageId")
      .populate("vehicleId")
      .populate("hotelId")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /* =====================
       ACCESS CONTROL
       Admin → all bookings
       User  → own bookings only
    ===================== */
    if (
      loggedInUser.userRole !== 1 &&   // not admin
      booking.user._id.toString() !== loggedInUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });

  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

module.exports = { getBookingById };
