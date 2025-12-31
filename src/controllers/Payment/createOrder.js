const Razorpay = require("razorpay");
const Booking = require("../../models/booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;

    /* ---------------- Validation ---------------- */
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    /* ---------------- Fetch Booking ---------------- */
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /* ---------------- Status Check ---------------- */
    if (booking.status !== "PaymentPending") {
      return res.status(400).json({
        success: false,
        message: "Payment is not allowed for this booking",
        currentStatus: booking.status,
      });
    }

    /* ---------------- Prevent Duplicate Orders ---------------- */
    if (booking.payment?.orderId) {
      return res.status(200).json({
        success: true,
        message: "Payment order already exists",
        data: {
          orderId: booking.payment.orderId,
          amount: booking.payment.amount * 100,
          currency: booking.payment.currency || "INR",
          bookingId: booking._id,
        },
      });
    }

    /* ---------------- Create Razorpay Order ---------------- */
    const order = await razorpay.orders.create({
      amount: booking.payment.amount * 100, // INR → paise
      currency: "INR",
      receipt: `booking_${booking._id}`,
      payment_capture: 1,
    });

    /* ---------------- Save Order ID ---------------- */
    booking.payment.orderId = order.id;
    booking.payment.currency = order.currency;
    await booking.save();

    /* ---------------- Response ---------------- */
    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
      },
    });

  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

module.exports = { createPaymentOrder };
