const Booking = require("../../models/booking");
const { hotelCollection } = require("../../models/hotel");
const { vehicleCollection } = require("../../models/vehicle");
const { HolidayPackage } = require("../../models/holidaysPackage");
const City = require("../../models/city");
const Category = require("../../models/category");

const getDashboardStats = async (req, res) => {
  try {
    /* ---------------- COUNTS ---------------- */
    const [
      hotels,
      vehicles,
      packages,
      totalBookings,
      pendingBookings,
      cities,
      categories
    ] = await Promise.all([
      hotelCollection.countDocuments(),
      vehicleCollection.countDocuments(),
      HolidayPackage.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "PaymentPending" }),
      City.countDocuments(),
      Category.countDocuments(),
    ]);

    /* ---------------- TOTAL REVENUE ---------------- */
    const revenueAgg = await Booking.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    /* ---------------- RECENT BOOKINGS ---------------- */
    const recentBookings = await Booking.find()
      .populate("user", "firstname lastname email")
      .sort({ createdAt: -1 })
      .limit(5);

    /* ---------------- RECENT TRANSACTIONS ---------------- */
    const recentTransactions = await Booking.find({
      "payment.status": "paid"
    })
      .select("payment totalPrice createdAt")
      .sort({ "payment.paidAt": -1 })
      .limit(5);

    /* ---------------- REVENUE TREND (LAST 7 DAYS) ---------------- */
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);

    const revenueTrend = await Booking.aggregate([
      {
        $match: {
          "payment.status": "paid",
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        hotels,
        vehicles,
        packages,
        adventures: 0, // optional if separate model exists later
        cities,
        categories,
        totalBookings,
        pendingBookings,
        totalRevenue,
        recentBookings,
        recentTransactions,
        revenueTrend,
      },
      message: "Dashboard stats fetched successfully",
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
      },
    });
  }
};

module.exports = getDashboardStats;
