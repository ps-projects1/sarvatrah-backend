require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment");
const {
  GST_PERCENT,
} = require("../config/taxConfig");

/**
 * ============================
 * 📬 Nodemailer Transporter
 * ============================
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 👈 force fast fail
});

/**
 * ============================
 * 📧 Generic Email Sender
 * ============================
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} options.text
 * @param {string} options.html
 * @param {string} options.from
 * @param {Array} options.attachments
 */
const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  from = `"Sarvatrah Support" <${process.env.EMAIL_USER}>`,
  attachments = [],
}) => {
  try {

    transporter.verify((err, success) => {
      if (err) {
        console.log("❌ SMTP ERROR:", err);
      } else {
        console.log("✅ SMTP READY");
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log(
      `📨 Email sent | ID: ${info.messageId} | ${moment().format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      "❌ Email sending failed:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );

    return { success: false, message: error.message };
  }
};

/**
 * ============================
 * 📩 1. Send Credentials
 * ============================
 * (NO BREAKING CHANGES)
 */
const sendCredentials = async (
  mail,
  user_id,
  password,
  callback = () => { }
) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome</h2>
      <p>Your login credentials are below:</p>

      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
        <thead style="background-color: #f5f5f5;">
          <tr>
            <th>User ID</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${user_id}</td>
            <td>${password}</td>
          </tr>
        </tbody>
      </table>

      <p>Please change your password after first login.</p>
      <p>Regards,<br/>Sarvatrah Team</p>
    </div>
  `;

  const result = await sendEmail({
    to: mail,
    subject: "Your Login Credentials",
    text: `User ID: ${user_id}, Password: ${password}`,
    html,
  });

  if (!result.success) {
    callback(false, { error: result.message });
  } else {
    callback(true, { message: "Email sent successfully" });
  }

  return result;
};

/**
 * ============================
 * 📩 2. Send OTP
 * ============================
 * (Signature unchanged)
 */
const sendOtp = async (mail, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>OTP Verification</h2>
      <p>Your One-Time Password is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br/>
      <p>Regards,<br/>Sarvatrah Support</p>
    </div>
  `;

  return await sendEmail({
    to: mail,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    html,
  });
};

/**
 * ============================
 * 💰 Send Refund Request Created Email
 * ============================
 */
const sendRefundInvoiceEmail = async ({
  email,
  bookingId,
  refundAmount,
  invoiceUrl
}) => {

  const html = `
  <div style="font-family:Arial">

  <h2>Refund Invoice</h2>

  <p>Your refund has been initiated for booking <b>${bookingId}</b></p>

  <p>Refund Amount: <b>-₹${refundAmount}</b></p>

  <p>
  Download your refund invoice:
  <a href="${invoiceUrl}">Download Invoice</a>
  </p>

  <p>Regards<br/>Sarvatrah Support</p>

  </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Refund Invoice for your Hotel Booking ${bookingId}`,
    html
  });
};

const sendBookingInvoiceEmail = async ({
  email,
  booking,
  invoiceUrl,
  voucherPdfUrl,
  ItineraryPdfUrl
}) => {

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const subTotal =
    booking.totalPrice || 0;

  const taxAmount = Math.round(
    (subTotal * GST_PERCENT) / 100
  );

  const grandTotal =
    subTotal + taxAmount;

  const paidAmount =
    booking.payment?.paidAmount ||
    booking.payment?.amount ||
    0;

  const pendingAmount =
    grandTotal - paidAmount;

  const itineraryPreview = booking.holidayPackageId?.itinerary
    ?.slice(0, 4)
    .map(day => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee">
          <b>Day ${day.dayNo}:</b> ${day.title || ""}
          <div style="font-size:13px;color:#6b7280;margin-top:4px">
            ${day.city?.name || ""} ${day.state?.name ? ", " + day.state.name : ""}
          </div>
        </td>
      </tr>
    `).join("") || "";

  const html = `
    <body style="margin:0;padding:0;background:#eef2f7;">

    <center style="width:100%;background:#eef2f7;">


      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">

            <!-- MAIN CONTAINER -->
    <table width="760" cellpadding="0" cellspacing="0" align="center"
    style="background:#ffffff;border-radius:12px;overflow:hidden;margin:0 auto;">

              <!-- HEADER -->
              <tr>
                <td style="background:#0a2540;padding:28px 32px;color:#ffffff">
                  <table width="100%">
                    <tr>
                      <td>
                        <img src="https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png" height="36"/>
                      </td>
                      <td align="right" style="font-size:13px;color:#cbd5e1">
                        Booking ID<br/>
                        <b style="color:#ffffff">${booking._id}</b>
                      </td>
                    </tr>
                  </table>

                  <h1 style="margin:22px 0 6px;font-size:22px;font-weight:600">
                    Booking Confirmation
                  </h1>
                  <p style="margin:0;font-size:14px;color:#cbd5e1">
                    Your trip has been successfully booked
                  </p>
                </td>
              </tr>

              <!-- SUMMARY STRIP -->
              <tr>
                <td style="padding:20px 32px;background:#f8fafc;border-bottom:1px solid #e5e7eb">
                  <table width="100%">
                    <tr>
                      <td align="center">
                        <div style="font-size:12px;color:#6b7280">Total</div>
                        <div style="font-size:20px;font-weight:700">₹${booking.totalPrice}</div>
                      </td>
                      <td align="center">
                        <div style="font-size:12px;color:#6b7280">Paid</div>
                        <div style="font-size:18px;font-weight:600;color:#16a34a">
                          ₹${booking.payment?.amount || 0}
                        </div>
                      </td>
                      <td align="center">
                        <div style="font-size:12px;color:#6b7280">Pending</div>
                        <div style="font-size:18px;font-weight:600;color:#dc2626">
                          ₹${pendingAmount}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:30px 32px">

                  <!-- CARD -->
                  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
                    <h3 style="margin:0 0 15px;font-size:16px;font-weight:600;color:#111827">
                      Trip Overview
                    </h3>

                    <table width="100%" style="font-size:14px">
                      <tr>
                        <td style="color:#6b7280;padding:6px 0;width:40%">Package</td>
                        <td style="font-weight:500">${booking.holidayPackageId?.packageName || "-"}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:6px 0">Destinations</td>
                        <td style="font-weight:500">${booking.holidayPackageId?.destinationCity?.join(", ") || "-"}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:6px 0">Duration</td>
                        <td style="font-weight:500">${booking.holidayPackageId?.packageDuration?.days || 0} Days</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:6px 0">Travel Dates</td>
                        <td style="font-weight:500">${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- TRAVELLERS -->
                  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
                    <h3 style="margin:0 0 15px;font-size:16px;font-weight:600">
                      Travellers
                    </h3>

                    ${booking.travellers.map(t => `
                      <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px">
                        <b>${t.name}</b>
                        <span style="color:#6b7280">(${t.gender}, ${t.age})</span>
                        ${t.isLeadTraveller ? '<span style="color:#16a34a;font-size:12px;margin-left:8px">Lead</span>' : ''}
                      </div>
                    `).join("")}
                  </div>

                  <!-- HOTEL + TRANSPORT -->
                  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
                    <h3 style="margin:0 0 15px;font-size:16px;font-weight:600">
                      Stay & Transport
                    </h3>

                    <table width="100%" style="font-size:14px">
                      <tr>
                        <td style="color:#6b7280;padding:6px 0;width:40%">Hotel</td>
                        <td style="font-weight:500">${booking.hotelId?.hotelName || "-"}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:6px 0">Room</td>
                        <td style="font-weight:500">${booking.hotelDetails?.roomType || "-"}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:6px 0">Vehicle</td>
                        <td style="font-weight:500">${booking.vehicleId?.vehicleType || "-"}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- ITINERARY -->
                  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
                    <h3 style="margin:0 0 15px;font-size:16px;font-weight:600">
                      Itinerary Preview
                    </h3>

                    <table width="100%">
                      ${itineraryPreview}
                    </table>
                  </div>

                  <!-- INCLUSIONS -->
                  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px">
                    <h3 style="margin:0 0 10px;font-size:16px;font-weight:600">
                      Inclusions
                    </h3>
                    <p style="font-size:14px;color:#374151;margin:0">
                      ${booking.holidayPackageId?.include || "-"}
                    </p>

                    <h3 style="margin:20px 0 10px;font-size:16px;font-weight:600">
                      Exclusions
                    </h3>
                    <p style="font-size:14px;color:#374151;margin:0">
                      ${booking.holidayPackageId?.exclude || "-"}
                    </p>
                  </div>

                  <!-- CTA -->
                  <div style="text-align:center;margin-top:30px">
                    <a href="${invoiceUrl}"
                      style="background:#0a2540;color:#ffffff;padding:14px 30px;
                      text-decoration:none;border-radius:6px;font-weight:600;display:inline-block">
                      Download Invoice
                    </a>
                  </div>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="background:#f3f4f6;padding:18px;text-align:center;font-size:12px;color:#6b7280">
                  Need help? Contact our support team<br/>
                  © Sarvatrah
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </center>

    </body>
    `;

  return await sendEmail({
    to: email,
    subject: `Booking Confirmation - ${booking._id}`,
    html,
    attachments: [
      { filename: "Invoice.pdf", path: invoiceUrl },
      { filename: "Voucher.pdf", path: voucherPdfUrl },
      { filename: "Itinerary.pdf", path: ItineraryPdfUrl }
    ]
  });
};


/**
 * ============================
 * 💰 Partial Payment Reminder
 * ============================
 */
const sendPartialPaymentReminderEmail = async ({
  email,
  guestName,
  bookingId,
  amount,
  dueDate,
  paymentLink
}) => {

  const html = `
  <div style="background:#eef2f7;padding:40px 0;font-family:Arial,Helvetica,sans-serif">

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <!-- MAIN CONTAINER -->
          <table width="760" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">

            <!-- HEADER -->
            <tr>
              <td style="background:#0a2540;padding:28px 32px;color:#ffffff">
                <table width="100%">
                  <tr>
                    <td>
                      <img src="https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png" height="36"/>
                    </td>
                    <td align="right" style="font-size:13px;color:#cbd5e1">
                      Booking ID<br/>
                      <b style="color:#ffffff">${bookingId}</b>
                    </td>
                  </tr>
                </table>

                <h1 style="margin:22px 0 6px;font-size:22px;font-weight:600">
                  Payment Reminder
                </h1>
                <p style="margin:0;font-size:14px;color:#cbd5e1">
                  Complete your payment to secure your booking
                </p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:30px 32px">

                <!-- GREETING -->
                <p style="font-size:14px;margin-bottom:20px">
                  Hello <b>${guestName}</b>,
                </p>

                <p style="font-size:14px;margin-bottom:20px;color:#374151">
                  Your booking with <b>Sarvatrah</b> is awaiting a pending payment.
                  Please complete it before the due date to avoid cancellation.
                </p>

                <!-- PAYMENT CARD -->
                <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:20px;background:#f8fafc">
                  
                  <table width="100%">
                    <tr>
                      <td>
                        <div style="font-size:12px;color:#6b7280">Amount Due</div>
                        <div style="font-size:22px;font-weight:700;color:#dc2626">
                          ₹${amount}
                        </div>
                      </td>

                      <td align="right">
                        <div style="font-size:12px;color:#6b7280">Due Date</div>
                        <div style="font-size:16px;font-weight:600">
                          ${dueDate}
                        </div>
                      </td>
                    </tr>
                  </table>

                </div>

                <!-- CTA BUTTON -->
                <div style="text-align:center;margin-top:30px">
                  <a href="${paymentLink}"
                    style="background:#0a2540;color:#ffffff;padding:14px 30px;
                    text-decoration:none;border-radius:6px;font-weight:600;display:inline-block">
                    Pay Now
                  </a>
                </div>

                <!-- NOTE -->
                <p style="font-size:13px;color:#6b7280;margin-top:25px;text-align:center">
                  If you’ve already completed the payment, please ignore this email.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f3f4f6;padding:18px;text-align:center;font-size:12px;color:#6b7280">
                Need help? Contact our support team<br/>
                © Sarvatrah Pvt Ltd
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Payment Reminder - Booking ${bookingId}`,
    html
  });
};


/**
 * ============================
 * ⚠️ Final Payment Reminder
 * ============================
 */
const sendFinalPaymentReminderEmail = async ({
  email,
  guestName,
  bookingId,
  amount,
  paymentLink
}) => {

  const html = `
  <div style="font-family:Arial">

  <h2>Final Reminder Before Cancellation</h2>

  <p>Hello <b>${guestName}</b>,</p>

  <p>
  Pending payment of <b>₹${amount}</b> for booking ID <b>${bookingId}</b> is due today.
  </p>

  <p>
  To avoid cancellation, please complete payment immediately.
  </p>

  <p>
  Pay Now:
  <a href="${paymentLink}">${paymentLink}</a>
  </p>

  <br/>
  <p>Regards<br/>Sarvatrah Team</p>

  </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Final Payment Reminder for Booking ${bookingId}`,
    html
  });
};

/**
 * ============================
 * 📦 Exports
 * ============================
 */
module.exports = {
  sendEmail,
  sendCredentials,
  sendOtp,
  sendRefundInvoiceEmail,
  sendBookingInvoiceEmail,
  sendPartialPaymentReminderEmail,
  sendFinalPaymentReminderEmail

};
