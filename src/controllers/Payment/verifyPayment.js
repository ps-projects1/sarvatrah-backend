const crypto = require("crypto");
const Booking = require("../../models/booking");

const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    /* ---------------- Validation ---------------- */
    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
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

    /* ---------------- Status Guard ---------------- */
    if (booking.status !== "PaymentPending") {
      return res.status(400).json({
        success: false,
        message: "Payment verification not allowed for this booking",
        currentStatus: booking.status,
      });
    }

    /* ---------------- Order ID Match ---------------- */
    if (booking.payment?.orderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID mismatch",
      });
    }

    /* ---------------- Signature Verification ---------------- */
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Mark payment failed
      booking.payment.status = "failed";
      booking.status = "PaymentFailed";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    /* ---------------- Payment Success ---------------- */
    booking.payment.paymentId = razorpay_payment_id;
    booking.payment.signature = razorpay_signature;
    booking.payment.status = "paid";
    booking.payment.paidAt = new Date();

    booking.status = "Confirmed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Booking confirmed.",
      data: {
        bookingId: booking._id,
        paymentId: razorpay_payment_id,
        status: booking.status,
      },
    });

  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

module.exports = { verifyPayment };
