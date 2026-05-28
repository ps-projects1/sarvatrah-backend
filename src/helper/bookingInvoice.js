const fs = require("fs");
const path = require("path");
const moment = require("moment");
const toWords = require("number-to-words");

const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");

const {
  GST_PERCENT,
} = require("../config/taxConfig");

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

    const paidAmount =
      booking.payment?.paidAmount ||
      booking.payment?.amount ||
      0;

    const subTotal =
      booking.totalPrice || 0;

    const taxPercent = GST_PERCENT;

    const taxAmount = Math.round(
      (subTotal * taxPercent) / 100
    );

    const totalAmount =
      subTotal + taxAmount;

    const balanceAmount =
      totalAmount - paidAmount;

    const amountWords =
      toWords
        .toWords(totalAmount)
        .replace(/,/g, "") +
      " only";

    const packageData = booking.holidayPackageId || {};
    const itinerary = packageData.itinerary || [];

    // Format dates
    const startDate = moment(booking.startDate).format("DD MMM YYYY");
    const endDate = moment(booking.endDate).format("DD MMM YYYY");

    // Rooms
    const rooms = booking.hotelDetails?.occupancy || "N/A";
    const roomType = booking.hotelDetails?.roomType || "N/A";

    // Travellers count
    const totalPeople = booking.totalTraveller;

    // Build itinerary HTML
    let itineraryHtml = "";

    itinerary.forEach((day) => {
      const city = day.city?.name || "";
      const state = day.state?.name || "";

      // Activities HTML
      let activitiesHtml = "";
      if (day.activities && day.activities.length > 0) {
        activitiesHtml = "<ul>";
        day.activities.forEach((act) => {
          activitiesHtml += `<li>
            <b>${act.title}</b> (${act.type}) - ${act.description || ""}
          </li>`;
        });
        activitiesHtml += "</ul>";
      }

      // Meals (ONLY IF EXISTS)
      let mealsHtml = "";
      if (day.mealsIncluded && day.mealsIncluded.length > 0) {
        mealsHtml = `<br/><small><b>Meals:</b> ${day.mealsIncluded.join(", ")}</small>`;
      }

      itineraryHtml += `
        <tr>
          <td style="width:15%"><b>Day ${day.dayNo}</b></td>
          <td>
            <b>${day.title || ""}</b><br/>
            <small>${city}${city && state ? ", " : ""}${state}</small>
            ${mealsHtml}
            <br/>
            ${activitiesHtml}
          </td>
        </tr>
      `;
    });

    const pkg = booking.holidayPackageId || {};

    const packageName = pkg.packageName || "N/A";
    const duration = pkg.packageDuration
      ? `${pkg.packageDuration.days} Days / ${pkg.packageDuration.nights} Nights`
      : "N/A";

    const packageType = pkg.packageType || "N/A";

    const destinations = (pkg.destinationCity || []).join(", ") || "N/A";

    const formatText = (text) =>
      text ? text.replace(/\n/g, "<br/>") : "N/A";

    const highlights = formatText(pkg.highlights) || "N/A";
    const includes = formatText(pkg.include) || "N/A";
    const excludes = formatText(pkg.exclude) || "N/A";

    let dueDateBlock = "";

    if (
      booking.partialPayment &&
      booking.payment?.status !== "paid" &&
      booking.partialPaymentDueDate
    ) {
      dueDateBlock = `
        <br/>
        Due Date: <b>${moment(booking.partialPaymentDueDate).format("DD MMM YYYY")}</b>
      `;
    }

    const templateData = {
      invoiceId: booking._id,
      invoiceDate: moment(booking.createdAt).format("DD/MM/YYYY"),

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

      total: totalAmount,
      paid: paidAmount,
      balance: balanceAmount,

      travellerName: leadTraveller?.name || "",
      amountWords: amountWords,
      logo: logoUrl,

      startDate,
      endDate,
      totalPeople,
      rooms,
      roomType,

      itinerary: itineraryHtml,

      leadTravellerName: leadTraveller?.name || "",

      packageName,
      duration,
      packageType,
      destinations,
      highlights,
      includes,
      excludes,
    };

    html = html.replace("{{DUE_DATE_BLOCK}}", dueDateBlock);

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