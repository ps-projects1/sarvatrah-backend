const fs = require("fs");
const path = require("path");
const moment = require("moment");
const toWords = require("number-to-words");

const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");

const generateBookingInvoice = async ({ booking, user }) => {
  try {
    /* =========================
       LOAD HTML TEMPLATE
    ========================= */
    const baseUrl = process.env.BASE_URL || "http://localhost:3232";

    const logoUrl = `${baseUrl}/public/sarvatrah_logo.png`;

    const templatePath = path.join(__dirname, "../templates/bookingInvoice.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    const leadTraveller = booking.travellers.find(t => t.isLeadTraveller);

    const billing = booking.billingInfo || {};

    const paidAmount = booking.payment?.amount || 0;
    const subTotal = booking.totalPrice || 0;

    const taxPercent = 18;
    const taxAmount = Math.round((subTotal * taxPercent) / 100);

    const totalAmount = subTotal + taxAmount;

    // ✅ Correct calculation
    const balanceAmount = totalAmount - paidAmount;
    const amountWords = toWords.toWords(totalAmount).replace(/,/g, "") + " only";

    const templateData = {
      invoiceId: booking._id,
      invoiceDate: moment(booking.createdAt).format("DD/MM/YYYY"),
      dueDate: moment(booking.createdAt).format("DD/MM/YYYY"),

      place: billing.state || "N/A",

      customerName: `${billing.firstName || user.firstname} ${billing.lastName || user.lastname}`,
      customerAddress: `${billing.address || ""}, ${billing.city || ""}, ${billing.state || ""}`,
      customerGST: billing.gstNumber || "N/A",

      packageName:
        booking.bookingType === "holiday"
          ? booking.holidayPackageId?.packageName || "Holiday Package"
          : booking.bookingType === "pilgrimage"
            ? "Pilgrimage Package"
            : "Experience",

      price: totalAmount,
      subtotal: totalAmount,
      taxPercent: `${taxPercent}%`,
      taxAmount: taxAmount,

      total: totalAmount + taxAmount,
      paid: paidAmount,
      balance: balanceAmount,

      travellerName: leadTraveller?.name || "",
      amountWords: amountWords,
      logo: logoUrl,
    };

    Object.keys(templateData).forEach((key) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), templateData[key]);
    });

    /* =========================
       LAUNCH BROWSER (AUTO SWITCH)
    ========================= */

    let browser;

    if (process.env.NODE_ENV === "development") {
      // 👉 LOCAL
      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        timeout: 60000, // 🔥 increase timeout
      });
    } else {
      // 👉 VERCEL / SERVERLESS
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    /* =========================
       FILE PATH
    ========================= */
    const filePath =
      process.env.NODE_ENV === "production"
        ? `/tmp/booking-${booking._id}.pdf` // Vercel
        : path.join(__dirname, `../invoices/booking-${booking._id}.pdf`);

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
    console.error("PDF Generation Error:", err);
    throw err;
  }
};

module.exports = generateBookingInvoice;