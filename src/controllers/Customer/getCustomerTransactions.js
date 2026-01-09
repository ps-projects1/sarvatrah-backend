const Booking = require("../../models/booking");

const getCustomerTransactions = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .select("payment totalPrice status createdAt");

    const transactions = bookings.map(b => ({
      bookingId: b._id,
      amount: b.totalPrice,
      status: b.payment?.status,
      paymentId: b.payment?.paymentId,
      date: b.createdAt,
    }));

    return res.json({
      success: true,
      data: transactions,
      message: "Customer transactions fetched",
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

module.exports = getCustomerTransactions;
