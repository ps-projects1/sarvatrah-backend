const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

const generateBookingInvoice = async ({ booking, user }) => {

  const html = `
  <html>
  <body style="font-family:Arial;padding:40px">

  <h2>Booking Invoice</h2>

  <p>
  Customer: ${user.firstname} ${user.lastname}<br/>
  Email: ${user.email}
  </p>

  <p>
  Booking ID: ${booking._id}<br/>
  Booking Date: ${moment(booking.createdAt).format("DD MMM YYYY")}<br/>
  Travel Dates: ${moment(booking.startDate).format("DD MMM YYYY")} - 
  ${moment(booking.endDate).format("DD MMM YYYY")}
  </p>

  <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%">
    <tr>
      <th>Description</th>
      <th>Amount</th>
    </tr>

    <tr>
      <td>Package Booking</td>
      <td>₹${booking.totalPrice}</td>
    </tr>

  </table>

  <h3>Total Amount: ₹${booking.totalPrice}</h3>

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html);

  const invoiceDir = path.join(__dirname, "../invoices");

  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir);
  }

  const filePath = `${invoiceDir}/booking-${booking._id}.pdf`;

  await page.pdf({
    path: filePath,
    format: "A4"
  });

  await browser.close();

  return filePath;
};

module.exports = generateBookingInvoice;