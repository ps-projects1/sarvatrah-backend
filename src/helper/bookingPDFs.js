const fs = require("fs");
const path = require("path");
const moment = require("moment");
const toWords = require("number-to-words");

const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");

const generatePDF = async (html, filename) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const filePath = `/tmp/${filename}`;

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true
  });

  await browser.close();
  return filePath;
};

const generateVoucherPDF = async ({ booking, user }) => {
  let html = fs.readFileSync(path.join(__dirname, "../templates/bookingVoucher.html"), "utf-8");
  const logoUrl = "https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png";

  const pkg = booking.holidayPackageId || {};
  const lead = booking.travellers.find(t => t.isLeadTraveller);

  const data = {
    bookingId: booking._id,
    leadTraveller: lead?.name,
    startDate: moment(booking.startDate).format("DD MMM YYYY"),
    endDate: moment(booking.endDate).format("DD MMM YYYY"),
    hotelName: booking.hotelId?.hotelName || "-",
    vehicle: booking.vehicleId?.vehicleType || "-",
    totalPeople: booking.totalTraveller,
    roomType: booking.hotelDetails?.roomType || "-",   // ✅ FIX
    destinations: (pkg.destinationCity || []).join(", ") || "-", // ✅ FIX
    logo: logoUrl
  };

  Object.keys(data).forEach(key => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), data[key]);
  });

  return generatePDF(html, `voucher-${booking._id}.pdf`);
};

const generateItineraryPDF = async ({ booking }) => {
  let html = fs.readFileSync(path.join(__dirname, "../templates/itinerary.html"), "utf-8");
  const logoUrl = "https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png";

  const itinerary = booking.holidayPackageId.itinerary;

  const itineraryHtml = itinerary.map(day => {
  return `
    <div class="day-card">

      <div class="day-header">
        <div>
          <div class="day-title">Day ${day.dayNo} - ${day.title || ""}</div>
          <div class="location">
            ${day.city?.name || ""} ${day.state?.name ? ", " + day.state.name : ""}
          </div>
        </div>
        <div class="day-badge">Day ${day.dayNo}</div>
      </div>

      ${
        day.description
          ? `<div class="description">${day.description}</div>`
          : ""
      }

      ${
        day.mealsIncluded?.length
          ? `<div class="section">
              <div class="section-title">🍽 Meals</div>
              ${day.mealsIncluded.map(m => `<span class="tag">${m}</span>`).join("")}
            </div>`
          : ""
      }

      ${
        day.activities?.length
          ? `<div class="section">
              <div class="section-title">🎯 Activities</div>
              ${day.activities.map(a => `<span class="tag">${a.title}</span>`).join("")}
            </div>`
          : ""
      }

      ${
        day.transport?.type
          ? `<div class="section">
              <div class="section-title">🚗 Transport</div>
              <span class="tag">${day.transport.type}</span>
            </div>`
          : ""
      }

      ${
        day.stay && day.hotels?.length
          ? `<div class="section">
              <div class="section-title">🏨 Stay</div>
              <span class="tag">${day.hotels[0].hotelName}</span>
            </div>`
          : ""
      }

    </div>
  `;
}).join("");

  html = html
    .replace("{{itinerary}}", itineraryHtml)
    .replace("{{startDate}}", moment(booking.startDate).format("DD MMM YYYY"))
    .replace("{{endDate}}", moment(booking.endDate).format("DD MMM YYYY"))
    .replace("{{logo}}", logoUrl);

  return generatePDF(html, `itinerary-${booking._id}.pdf`);
};

module.exports = { generateVoucherPDF, generateItineraryPDF };