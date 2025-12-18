require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment");

/**
 * ============================
 * 📬 Nodemailer Transporter
 * ============================
 */
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
  callback = () => {}
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
 * 📦 Exports
 * ============================
 */
module.exports = {
  sendEmail,
  sendCredentials,
  sendOtp,
};
