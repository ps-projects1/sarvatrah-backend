require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

/**
 * Generic Email Sender
 * @param {Object} options
 * @param {string|string[]} options.to - Receiver email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Fallback plain text
 * @param {string} options.html - HTML body
 * @param {string} options.from - Optional custom sender name/email
 * @param {Array} options.attachments - Optional file attachments
 */
const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  from = `"Sarvatrah 😎" <${process.env.EMAIL_USER}>`,
  attachments = [],
}) => {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      "Email sending failed:",
      error,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    return { success: false, message: error.message };
  }
};

//
// 📩 1. Send Credentials
//
const sendCredentials = async (
  mail,
  user_id,
  password,
  callback = () => {}
) => {
  const html = `
    <p>Hello,</p>
    <p>Your user ID and password are as follows:</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      <thead style="background-color: #f8f8f8;">
        <tr><th>User ID</th><th>Password</th></tr>
      </thead>
      <tbody>
        <tr><td>${user_id}</td><td>${password}</td></tr>
      </tbody>
    </table>
    <p>Thank you!</p>
  `;

  const result = await sendEmail({
    to: mail,
    subject: "Your Login Credentials",
    text: `Your credentials: ID: ${user_id}, Password: ${password}`,
    html,
  });

  if (!result.success) {
    callback(false, { error: result.message });
  } else {
    callback(true, { message: "Email sent" });
  }

  return result;
};

//
// 📩 2. Send OTP
//
const sendOtp = async (mail, otp) => {
  const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
  return await sendEmail({
    to: mail,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}`,
    html,
    from: '"Prince Patidar 😎" <princegangadiya99k@gmail.com>',
  });
};

module.exports = {
  sendEmail,
  sendCredentials,
  sendOtp,
};
