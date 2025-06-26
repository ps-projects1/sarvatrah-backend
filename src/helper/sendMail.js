require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment");

// send sendCredentials
var sendCredentials = async (
  mail,
  user_id,
  password,
  callback = "function"
) => {
  // variable declaration
  let responseSuccess, responseData;

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

  try {
    let info = await transporter.sendMail({
      from: '"Prince Patidar 😎" <princegangadiya99k@gmail.com>', // sender address
      to: mail, // list of receivers
      subject: "Id and Password", // Subject line
      text: "Namste sir🙏🙏🙏", // plain text body
      html: `
      <p>Hello,</p>
      <p>Your user ID and password details are as follows:</p>
      <table border="1">
          <tr>
              <th>User ID</th>
              <th>Password</th>
          </tr>
          <tr>
              <td>${user_id}</td>
              <td>${password}</td>
          </tr>
      </table>
      <p>Thank you!</p>
  `,
      // html: `<a href='http://localhost:3000/users/resetPassword/${auth_token}'>Reset password</a>`, // html body
      // attachments: [
      //     {   // filename and content type is derived from path
      //         path: '/Users/sotsys140/Downloads/stefan-stefancik-QXevDflbl8A-unsplash.jpg'
      //     }
      // ]
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com> 

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return { responseSuccess: true };
  } catch (error) {
    console.error("Error sending email:", error);

    // Error response
    responseSuccess = false;
    responseData = { error: "Failed to send email" };

    // You can customize the response based on the specific error
    if (error.code === "ENOTFOUND") {
      responseData = { error: "Email address not found" };
    }

    // Call the callback with the error response
    if (typeof callback === "function") {
      callback(responseSuccess, responseData);
    }
  }
};

// send otp
var sendOtp = async (mail, otp) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: true,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: '"Prince Patidar 😎" <princegangadiya99k@gmail.com>', // sender address
      to: mail,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    console.log("Message sent for OTP: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error(
      "Error sending OTP email:",
      error,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    return { success: false, message: error };
  }
};

module.exports = {
  sendCredentials,
  sendOtp,
};
