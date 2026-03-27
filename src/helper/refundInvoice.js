const fs = require("fs");
const path = require("path");
const moment = require("moment");

const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");

const generateRefundInvoice = async ({ booking, refund, user }) => {
  try {
    const originalAmount = refund.originalAmount;
    const refundAmount = refund.refundAmount;
    const cancellationCharge = originalAmount - refundAmount;

    /* =========================
       HTML TEMPLATE
    ========================= */
    const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 40px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; }
        .total { text-align: right; font-size: 18px; margin-top: 20px; }
      </style>
    </head>

    <body>

    <h2>Refund Invoice</h2>

    <p>
    Customer: ${user.firstname} ${user.lastname}<br/>
    Email: ${user.email}
    </p>

    <p>
    Booking ID: ${booking._id}<br/>
    Stay: ${moment(booking.startDate).format("DD MMM YYYY")} - 
          ${moment(booking.endDate).format("DD MMM YYYY")}
    </p>

    <table>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>

      <tr>
        <td>Original Booking Amount</td>
        <td>₹${originalAmount}</td>
      </tr>

      <tr>
        <td>Refund Amount</td>
        <td>-₹${refundAmount}</td>
      </tr>

      ${
        cancellationCharge > 0
          ? `<tr>
               <td>Cancellation Charge</td>
               <td>₹${cancellationCharge}</td>
             </tr>`
          : ""
      }

    </table>

    <div class="total">
      Total Refund: -₹${refundAmount}
    </div>

    </body>
    </html>
    `;

    /* =========================
       LAUNCH BROWSER (AUTO SWITCH)
    ========================= */
    let browser;

    if (process.env.NODE_ENV === "production") {
      // 👉 VERCEL / SERVERLESS
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // 👉 LOCAL
      browser = await puppeteer.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    /* =========================
       FILE PATH HANDLING
    ========================= */
    const filePath =
      process.env.NODE_ENV === "production"
        ? `/tmp/refund-${booking._id}.pdf`
        : path.join(__dirname, `../invoices/refund-${booking._id}.pdf`);

    if (process.env.NODE_ENV !== "production") {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    /* =========================
       GENERATE PDF
    ========================= */
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return filePath;

  } catch (err) {
    console.error("Refund PDF Error:", err);
    throw err;
  }
};

module.exports = generateRefundInvoice;