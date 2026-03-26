// const Refund = require("../../models/refund");
// const Booking = require("../../models/booking");
// const Razorpay = require("razorpay");

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const processRefund = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { action, remarks, refundPercentage } = req.body;

//     /* ---------------- VALIDATION ---------------- */
//     if (!action || !["approve", "reject", "complete", "fail"].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid action is required",
//       });
//     }

//     /* ---------------- FETCH REFUND ---------------- */
//     const refund = await Refund.findById(id).populate("booking");
//     if (!refund) {
//       return res.status(404).json({
//         success: false,
//         message: "Refund not found",
//       });
//     }

//     /* ---------------- STATUS TRANSITIONS ---------------- */
//     const validTransitions = {
//       pending: ["approve", "reject"],
//       approved: ["complete", "fail"],
//       processing: ["complete", "fail"],
//       rejected: [],
//       completed: [],
//       failed: ["approve"], // retry allowed
//     };

//     if (!validTransitions[refund.status].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot ${action} refund with status ${refund.status}`,
//       });
//     }

//     /* ---------------- COMMON UPDATE DATA ---------------- */
//     const updateData = {
//       processedBy: req.user._id,
//       processedAt: new Date(),
//       adminRemarks: remarks || refund.adminRemarks,
//     };

//     /* ---------------- HANDLE ACTIONS ---------------- */
//     switch (action) {
//       case "approve":
//         updateData.status = "approved";

//         // update percentage if changed
//         if (
//           refundPercentage !== undefined &&
//           refundPercentage !== refund.refundPercentage
//         ) {
//           updateData.refundPercentage = refundPercentage;
//           updateData.refundAmount = Math.round(
//             (refund.originalAmount * refundPercentage) / 100
//           );
//         }

//         // reset previous failure (for retry)
//         updateData["paymentDetails.gatewayResponse"] = null;

//         break;

//       case "reject":
//         updateData.status = "rejected";
//         break;

//       case "complete":
//         try {
//           const booking = refund.booking;

//           /* ----------- SAFETY CHECKS ----------- */
//           if (!booking?.payment?.paymentId) {
//             throw new Error("Payment ID not found");
//           }

//           if (refund.paymentDetails?.refundId) {
//             throw new Error("Refund already processed");
//           }

//           if (booking.payment.status !== "paid") {
//             throw new Error("Cannot refund unpaid booking");
//           }

//           /* ----------- CALL RAZORPAY ----------- */
//           const refundAmountInPaise = refund.refundAmount * 100;

//           const razorpayRefund = await razorpay.payments.refund(
//             booking.payment.paymentId,
//             {
//               amount: refundAmountInPaise,
//               notes: {
//                 bookingId: booking._id.toString(),
//                 refundId: refund.refundId,
//               },
//             }
//           );

//           /* ----------- VALIDATE RESPONSE ----------- */
//           if (!razorpayRefund || !razorpayRefund.id) {
//             throw new Error("Refund failed at Razorpay");
//           }

//           /* ----------- SUCCESS ----------- */
//           updateData.status = "completed";

//           updateData["paymentDetails.refundId"] = razorpayRefund.id;
//           updateData["paymentDetails.refundTransactionId"] =
//             razorpayRefund.id;
//           updateData["paymentDetails.refundedAt"] = new Date();

//           updateData["paymentDetails.gatewayResponse"] = razorpayRefund;

//           // ✅ Update booking ONLY on success
//           await Booking.findByIdAndUpdate(booking._id, {
//             status: "Refunded",
//             "payment.status": "refunded",
//           });

//         } catch (err) {
//           console.error("Razorpay refund error:", err);

//           /* ----------- EXTRACT ERROR PROPERLY ----------- */
//           const razorpayError =
//             err?.error?.description ||
//             err?.error?.reason ||
//             err?.message ||
//             "Refund failed";

//           updateData.status = "failed";

//           updateData["paymentDetails.gatewayResponse"] = {
//             status: "failed",
//             message: razorpayError,
//             raw: err,
//           };
//         }

//         break;

//       case "fail":
//         updateData.status = "failed";
//         updateData["paymentDetails.gatewayResponse"] = {
//           status: "failed",
//           message: remarks || "Refund manually marked as failed",
//           failedAt: new Date(),
//         };
//         break;
//     }

//     /* ---------------- UPDATE REFUND ---------------- */
//     const updatedRefund = await Refund.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     )
//       .populate("booking", "totalPrice startDate endDate status")
//       .populate("user", "firstname lastname email")
//       .populate("processedBy", "username email")
//       .lean();

//     /* ---------------- FINAL RESPONSE ---------------- */
//     const isSuccess = updatedRefund.status === "completed";

//     return res.status(isSuccess ? 200 : 400).json({
//       success: isSuccess,
//       data: updatedRefund,
//       message: isSuccess
//         ? "Refund processed successfully"
//         : updatedRefund?.paymentDetails?.gatewayResponse?.message ||
//           "Refund failed",
//     });

//   } catch (error) {
//     console.error("Process Refund Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Error processing refund",
//       error: error.message,
//     });
//   }
// };

// module.exports = { processRefund };


const Refund = require("../../models/refund");
const Booking = require("../../models/booking");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callRazorpayWithRetry = async (paymentId, payload, refundId) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`[Refund:${refundId}] Razorpay attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`, {
        paymentId,
        amount: payload.amount,
        amountInRupees: payload.amount / 100,
      });

      const result = await razorpay.payments.refund(paymentId, payload);

      console.log(`[Refund:${refundId}] Razorpay SUCCESS on attempt ${attempt}`, {
        razorpayRefundId: result.id,
        status: result.status,
        amount: result.amount,
        paymentId: result.payment_id,
      });

      return { success: true, data: result, attempts: attempt };

    } catch (err) {
      lastError = err;

      const errorDetail = {
        attempt,
        errorCode: err?.error?.code,
        errorDescription: err?.error?.description,
        errorReason: err?.error?.reason,
        httpStatus: err?.statusCode,
        message: err?.message,
      };

      console.error(`[Refund:${refundId}] Razorpay FAILED on attempt ${attempt}`, errorDetail);

      // Don't retry on these — they will never succeed
      const nonRetryableCodes = [
        "BAD_REQUEST_ERROR",  // wrong paymentId, already refunded, etc.
        "GATEWAY_ERROR",      // payment not captured
      ];

      const errorCode = err?.error?.code;
      if (nonRetryableCodes.includes(errorCode)) {
        console.warn(`[Refund:${refundId}] Non-retryable error (${errorCode}), stopping retry`);
        break;
      }

      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`[Refund:${refundId}] Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await sleep(RETRY_DELAY_MS * attempt); // exponential backoff: 1s, 2s, 3s
      }
    }
  }

  return { success: false, error: lastError };
};

const processRefund = async (req, res) => {
  const { id } = req.params;
  const { action, remarks, refundPercentage } = req.body;

  console.log(`\n[Refund:${id}] ====== PROCESS REFUND START ======`);
  console.log(`[Refund:${id}] Action: ${action} | Admin: ${req.user?._id}`);

  try {
    /* ---------------- VALIDATION ---------------- */
    if (!action || !["approve", "reject", "complete", "fail"].includes(action)) {
      console.warn(`[Refund:${id}] Invalid action received: "${action}"`);
      return res.status(400).json({ success: false, message: "Valid action is required" });
    }

    /* ---------------- FETCH REFUND ---------------- */
    const refund = await Refund.findById(id).populate("booking");
    if (!refund) {
      console.warn(`[Refund:${id}] Refund not found in DB`);
      return res.status(404).json({ success: false, message: "Refund not found" });
    }

    console.log(`[Refund:${refund.refundId}] Found | Status: ${refund.status} | Amount: ₹${refund.refundAmount}`);

    /* ---------------- STATUS TRANSITIONS ---------------- */
    const validTransitions = {
      pending: ["approve", "reject"],
      approved: ["complete", "fail"],
      processing: ["complete", "fail"],
      rejected: [],
      completed: [],
      failed: ["approve"],
    };

    if (!validTransitions[refund.status].includes(action)) {
      console.warn(`[Refund:${refund.refundId}] Invalid transition: ${refund.status} → ${action}`);
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
        if (refundPercentage !== undefined && refundPercentage !== refund.refundPercentage) {
          updateData.refundPercentage = refundPercentage;
          updateData.refundAmount = Math.round((refund.originalAmount * refundPercentage) / 100);
          console.log(`[Refund:${refund.refundId}] Percentage updated: ${refundPercentage}% → ₹${updateData.refundAmount}`);
        }
        updateData["paymentDetails.gatewayResponse"] = null;
        console.log(`[Refund:${refund.refundId}] Approved`);
        break;

      case "reject":
        updateData.status = "rejected";
        console.log(`[Refund:${refund.refundId}] Rejected | Reason: ${remarks}`);
        break;

      case "complete":
        try {
          const booking = refund.booking;

          /* ----------- SAFETY CHECKS ----------- */
          console.log(`[Refund:${refund.refundId}] Running safety checks...`);

          if (!booking?.payment?.paymentId) {
            const msg = "Payment ID not found on booking";
            console.error(`[Refund:${refund.refundId}] SAFETY CHECK FAILED: ${msg}`, {
              bookingId: booking?._id,
              paymentObject: booking?.payment,
            });
            throw new Error(msg);
          }

          if (refund.paymentDetails?.refundId) {
            const msg = "Refund already processed";
            console.error(`[Refund:${refund.refundId}] SAFETY CHECK FAILED: ${msg}`, {
              existingRefundId: refund.paymentDetails.refundId,
            });
            throw new Error(msg);
          }

          if (booking.payment.status !== "paid") {
            const msg = `Cannot refund — booking payment status is "${booking.payment.status}", expected "paid"`;
            console.error(`[Refund:${refund.refundId}] SAFETY CHECK FAILED: ${msg}`);
            throw new Error(msg);
          }

          console.log(`[Refund:${refund.refundId}] Safety checks passed`, {
            paymentId: booking.payment.paymentId,
            bookingStatus: booking.payment.status,
            refundAmount: refund.refundAmount,
            refundAmountInPaise: refund.refundAmount * 100,
          });

          /* ----------- CALL RAZORPAY WITH RETRY ----------- */
          const razorpayResult = await callRazorpayWithRetry(
            booking.payment.paymentId,
            {
              amount: refund.refundAmount * 100,
              notes: {
                bookingId: booking._id.toString(),
                refundId: refund.refundId,
              },
            },
            refund.refundId
          );

          if (!razorpayResult.success) {
            throw razorpayResult.error;
          }

          const razorpayRefund = razorpayResult.data;

          /* ----------- SUCCESS ----------- */
          updateData.status = "completed";
          updateData["paymentDetails.refundId"] = razorpayRefund.id;
          updateData["paymentDetails.refundTransactionId"] = razorpayRefund.id;
          updateData["paymentDetails.refundedAt"] = new Date();
          updateData["paymentDetails.gatewayResponse"] = razorpayRefund;
          updateData["paymentDetails.attempts"] = razorpayResult.attempts;

          await Booking.findByIdAndUpdate(booking._id, {
            status: "Refunded",
            "payment.status": "refunded",
          });

          console.log(`[Refund:${refund.refundId}] ✅ COMPLETED | Razorpay ID: ${razorpayRefund.id} | Attempts: ${razorpayResult.attempts}`);

        } catch (err) {
          const razorpayError =
            err?.error?.description ||
            err?.error?.reason ||
            err?.message ||
            "Refund failed";

          console.error(`[Refund:${refund.refundId}] ❌ FAILED`, {
            reason: razorpayError,
            errorCode: err?.error?.code,
            httpStatus: err?.statusCode,
            fullError: err?.error || err?.message,
          });

          updateData.status = "failed";
          updateData["paymentDetails.gatewayResponse"] = {
            status: "failed",
            message: razorpayError,
            errorCode: err?.error?.code,
            failedAt: new Date(),
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
        console.log(`[Refund:${refund.refundId}] Manually marked as failed`);
        break;
    }

    /* ---------------- UPDATE REFUND ---------------- */
    const updatedRefund = await Refund.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("booking", "totalPrice startDate endDate status")
      .populate("user", "firstname lastname email")
      .populate("processedBy", "username email")
      .lean();

    const isSuccess = updatedRefund.status === "completed";

    console.log(`[Refund:${refund.refundId}] ====== PROCESS REFUND END | Final status: ${updatedRefund.status} ======\n`);

    return res.status(200).json({
      success: isSuccess,
      data: updatedRefund,
      message: isSuccess
        ? "Refund processed successfully"
        : updatedRefund?.paymentDetails?.gatewayResponse?.message || "Refund failed",
    });

  } catch (error) {
    console.error(`[Refund:${id}] ====== UNEXPECTED ERROR ======`, {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Error processing refund",
      error: error.message,
    });
  }
};

module.exports = { processRefund };