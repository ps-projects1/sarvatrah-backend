const cron = require("node-cron");
const moment = require("moment");
const Booking = require("../models/booking");

const {
  sendPartialPaymentReminderEmail,
  sendFinalPaymentReminderEmail
} = require("../helper/sendMail"); // adjust path if needed

/**
 * Runs every day at 9 AM
 */
cron.schedule("0 9 * * *", async () => {
  try {

    console.log("⏰ Running Partial Payment Reminder Cron");

    const today = moment().startOf("day");

    const bookings = await Booking.find({
      partialPayment: true,
      status: "PaymentPending"
    }).populate("user", "firstname email");

    for (const booking of bookings) {

      if (!booking.partialPaymentDueDate) continue;

      const dueDate = moment(booking.partialPaymentDueDate).startOf("day");

      const diffDays = dueDate.diff(today, "days");

      const partialAmount =
        (booking.totalPrice * booking.partialPaymentPercentage) / 100;

      const paymentLink = `${process.env.FRONTEND_URL}/payment/${booking._id}`;

      /* ======================
         FIRST REMINDER (2 days before)
      ====================== */

      if (diffDays === 2 && !booking.partialReminderSent) {

        await sendPartialPaymentReminderEmail({
          email: booking.user.email,
          guestName: booking.user.firstname,
          bookingId: booking._id,
          amount: partialAmount,
          dueDate: dueDate.format("DD MMM YYYY"),
          paymentLink
        });

        booking.partialReminderSent = true;
        await booking.save();

        console.log("📩 Partial reminder sent:", booking._id);
      }

      /* ======================
         FINAL REMINDER (Due day)
      ====================== */

      if (diffDays === 0 && !booking.finalReminderSent) {

        await sendFinalPaymentReminderEmail({
          email: booking.user.email,
          guestName: booking.user.firstname,
          bookingId: booking._id,
          amount: partialAmount,
          paymentLink
        });

        booking.finalReminderSent = true;
        await booking.save();

        console.log("⚠️ Final reminder sent:", booking._id);
      }
    }

  } catch (error) {
    console.error("❌ Partial Payment Cron Error:", error);
  }
});