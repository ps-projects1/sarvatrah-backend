const Booking = require("../../models/booking");
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

const fetchBookingByUser = async (req, res) => {
  try {
    const userId = req.user._id; // Authenticated user

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in token.",
      });
    }

    // 🔹 Optional Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    // 🔹 Get total booking count for user
    const total = await Booking.countDocuments({ user: userId });

    // 🔹 Paginated query
    const bookings = await Booking.find({ user: userId })
      .populate("user", "name email")
      .populate("holidayPackageId")
      .populate("vehicleId")
      .populate("hotelId")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      count: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error("Fetch Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
};


module.exports = { fetchBooking ,fetchBookingByUser };
