require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send OTP to a phone number via Twilio SMS
 * @param {string} phoneNumber - Recipient phone number with country code, e.g., +919876543210
 * @param {string|number} otp - The OTP to send
 * @returns {Promise<Object>} - Returns success or error info
 */
const sendOtpToPhone = async (phoneNumber, otp) => {
  if (!phoneNumber || !otp) {
    return { success: false, message: 'Phone number and OTP are required' };
  }

  try {
    const message = await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Twilio number from your account
      to: phoneNumber,
    });

    return {
      success: true,
      message: 'OTP sent successfully',
      sid: message.sid,
    };
  } catch (error) {
    console.error('Failed to send OTP:', error.message);
    return {
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    };
  }
};

module.exports = { sendOtpToPhone };
