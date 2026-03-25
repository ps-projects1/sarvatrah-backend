const Refund = require("../../models/refund");
const Booking = require("../../models/booking");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks, refundPercentage } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!action || !["approve", "reject", "complete", "fail"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action is required",
      });
    }

    /* ---------------- FETCH REFUND ---------------- */
    const refund = await Refund.findById(id).populate("booking");
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    /* ---------------- STATUS TRANSITIONS ---------------- */
    const validTransitions = {
      pending: ["approve", "reject"],
      approved: ["complete", "fail"],
      processing: ["complete", "fail"],
      rejected: [],
      completed: [],
      failed: ["approve"], // retry allowed
    };

    if (!validTransitions[refund.status].includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} refund with status ${refund.status}`,
      });
    }

    /* ---------------- COMMON UPDATE DATA ---------------- */
    const updateData = {
      processedBy: req.user._id,
      processedAt: new Date(),
      adminRemarks: remarks || refund.adminRemarks,
    };

    /* ---------------- HANDLE ACTIONS ---------------- */
    switch (action) {
      case "approve":
        updateData.status = "approved";

        // update percentage if changed
        if (
          refundPercentage !== undefined &&
          refundPercentage !== refund.refundPercentage
        ) {
          updateData.refundPercentage = refundPercentage;
          updateData.refundAmount = Math.round(
            (refund.originalAmount * refundPercentage) / 100
          );
        }

        // reset previous failure (for retry)
        updateData["paymentDetails.gatewayResponse"] = null;

        break;

      case "reject":
        updateData.status = "rejected";
        break;

      case "complete":
        try {
          const booking = refund.booking;

          /* ----------- SAFETY CHECKS ----------- */
          if (!booking?.payment?.paymentId) {
            throw new Error("Payment ID not found");
          }

          if (refund.paymentDetails?.refundId) {
            throw new Error("Refund already processed");
          }

          if (booking.payment.status !== "paid") {
            throw new Error("Cannot refund unpaid booking");
          }

          /* ----------- CALL RAZORPAY ----------- */
          const refundAmountInPaise = refund.refundAmount * 100;

          const razorpayRefund = await razorpay.payments.refund(
            booking.payment.paymentId,
            {
              amount: refundAmountInPaise,
              notes: {
                bookingId: booking._id.toString(),
                refundId: refund.refundId,
              },
            }
          );

          /* ----------- VALIDATE RESPONSE ----------- */
          if (!razorpayRefund || !razorpayRefund.id) {
            throw new Error("Refund failed at Razorpay");
          }

          /* ----------- SUCCESS ----------- */
          updateData.status = "completed";

          updateData["paymentDetails.refundId"] = razorpayRefund.id;
          updateData["paymentDetails.refundTransactionId"] =
            razorpayRefund.id;
          updateData["paymentDetails.refundedAt"] = new Date();

          updateData["paymentDetails.gatewayResponse"] = razorpayRefund;

          // ✅ Update booking ONLY on success
          await Booking.findByIdAndUpdate(booking._id, {
            status: "Refunded",
            "payment.status": "refunded",
          });

        } catch (err) {
          console.error("Razorpay refund error:", err);

          /* ----------- EXTRACT ERROR PROPERLY ----------- */
          const razorpayError =
            err?.error?.description ||
            err?.error?.reason ||
            err?.message ||
            "Refund failed";

          updateData.status = "failed";

          updateData["paymentDetails.gatewayResponse"] = {
            status: "failed",
            message: razorpayError,
            raw: err,
          };
        }

        break;

      case "fail":
        updateData.status = "failed";
        updateData["paymentDetails.gatewayResponse"] = {
          status: "failed",
          message: remarks || "Refund manually marked as failed",
          failedAt: new Date(),
        };
        break;
    }

    /* ---------------- UPDATE REFUND ---------------- */
    const updatedRefund = await Refund.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("booking", "totalPrice startDate endDate status")
      .populate("user", "firstname lastname email")
      .populate("processedBy", "username email")
      .lean();

    /* ---------------- FINAL RESPONSE ---------------- */
    const isSuccess = updatedRefund.status === "completed";

    return res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      data: updatedRefund,
      message: isSuccess
        ? "Refund processed successfully"
        : updatedRefund?.paymentDetails?.gatewayResponse?.message ||
          "Refund failed",
    });

  } catch (error) {
    console.error("Process Refund Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error processing refund",
      error: error.message,
    });
  }
};

module.exports = { processRefund };