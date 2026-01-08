const Booking = require("../../models/booking");
const mongoose = require("mongoose");

/**
 * GET /api/bookings
 * Query params:
 * page, limit, status, type, startDate, endDate, search
 */
const fetchAllBookings = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      status,
      type,
      startDate,
      endDate,
      search
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    /* ======================
       STATUS FILTER
    ====================== */
    if (status) {
      query.status = status;
    }

    /* ======================
       DATE RANGE FILTER
       (based on booking startDate)
    ====================== */
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    /* ======================
       SEARCH FILTER
       bookingId, name, email
    ====================== */
    if (search) {
      const isObjectId = mongoose.Types.ObjectId.isValid(search);

      query.$or = [
        ...(isObjectId ? [{ _id: search }] : []),
        { "billingInfo.email": { $regex: search, $options: "i" } },
        { "billingInfo.firstName": { $regex: search, $options: "i" } },
        { "billingInfo.lastName": { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    /* ======================
       FETCH BOOKINGS
    ====================== */
    const bookings = await Booking.find(query)
      .populate("user", "name email")
      .populate({
        path: "holidayPackageId",
        match: type ? { packageType: type } : {},
      })
      .populate("vehicleId")
      .populate("hotelId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    /* ======================
       HANDLE PACKAGE TYPE FILTER
    ====================== */
    const filteredBookings = type
      ? bookings.filter(b => b.holidayPackageId)
      : bookings;

    /* ======================
       TOTAL COUNT
    ====================== */
    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: filteredBookings.length,
      data: filteredBookings
    });

  } catch (error) {
    console.error("Fetch All Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
};

module.exports = { fetchAllBookings };
