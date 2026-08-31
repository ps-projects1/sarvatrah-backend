const fs = require("fs");
const path = require("path");
const moment = require("moment");

const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");


// ============================================================
// GENERATE PDF
// ============================================================

const generatePDF = async (
  html,
  filename
) => {

  let browser;


  if (
    process.env.NODE_ENV ===
    "development"
  ) {

    browser =
      await puppeteer.launch({

        headless: true,

        executablePath:
          puppeteer.executablePath(),

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],

        timeout: 60000,

      });

  } else {

    browser =
      await puppeteerCore.launch({

        args:
          chromium.args,

        executablePath:
          await chromium.executablePath(),

        headless: true,

      });

  }


  try {

    const page =
      await browser.newPage();


    await page.setContent(
      html,
      {
        waitUntil:
          "networkidle0"
      }
    );


    const filePath =
      process.env.NODE_ENV ===
      "production"

        ? `/tmp/${filename}`

        : path.join(
            __dirname,
            `../invoices/${filename}`
          );


    if (
      process.env.NODE_ENV !==
      "production"
    ) {

      const dir =
        path.dirname(
          filePath
        );


      if (
        !fs.existsSync(dir)
      ) {

        fs.mkdirSync(
          dir,
          {
            recursive: true
          }
        );

      }

    }


    await page.pdf({

      path:
        filePath,

      format:
        "A4",

      printBackground:
        true

    });


    return filePath;


  } finally {

    await browser.close();

  }

};


// ============================================================
// GENERATE VOUCHER PDF
// ============================================================

const generateVoucherPDF =
  async ({
    booking,
    user
  }) => {

    let html =
      fs.readFileSync(
        path.join(
          __dirname,
          "../templates/bookingVoucher.html"
        ),
        "utf-8"
      );


    const logoUrl =
      "https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png";


    const pkg =
      booking.holidayPackageId ||
      {};


    const lead =
      booking.travellers?.find(
        t =>
          t.isLeadTraveller
      );


    // ========================================================
    // VEHICLE DATA
    // ========================================================

    /*
     * New bookings:
     *
     * booking.vehicleIds = [
     *   vehicle1,
     *   vehicle2,
     *   vehicle3
     * ]
     *
     * Older bookings:
     *
     * booking.vehicleId
     *
     * are also supported.
     */

    let vehicles = [];


    if (
      Array.isArray(
        booking.vehicleIds
      ) &&
      booking.vehicleIds.length
    ) {

      vehicles =
        booking.vehicleIds;

    } else if (
      booking.vehicleId
    ) {

      vehicles = [
        booking.vehicleId
      ];

    }


    // ========================================================
    // BUILD VEHICLE HTML
    // ========================================================

    let vehicleHtml =
      "";


    if (
      vehicles.length === 0
    ) {

      vehicleHtml =
        `<div class="value">-</div>`;

    } else {

      vehicleHtml =
        vehicles
          .map(
            (vehicle, index) => {

              /*
               * If vehicleIds was not populated
               * for some reason, it may still
               * be an ObjectId/string.
               */

              const vehicleType =
                vehicle?.vehicleType ||
                vehicle?.type ||
                "Vehicle";


              const brandName =
                vehicle?.brandName ||
                vehicle?.brand ||
                "";


              const modelName =
                vehicle?.modelName ||
                vehicle?.model ||
                "";


              const seatLimit =
                vehicle?.seatLimit ||
                "";


              let vehicleName =
                vehicleType;


              if (
                brandName ||
                modelName
              ) {

                vehicleName +=
                  ` - ${
                    [brandName, modelName]
                      .filter(Boolean)
                      .join(" ")
                  }`;

              }


              return `
                <div class="vehicle-item">

                  <div class="vehicle-number">
                    Vehicle ${index + 1}
                  </div>

                  <div class="vehicle-name">
                    ${vehicleName}
                  </div>

                  ${
                    seatLimit
                      ? `
                        <div class="vehicle-seats">
                          Capacity: ${seatLimit} seats
                        </div>
                      `
                      : ""
                  }

                </div>
              `;

            }
          )
          .join("");

    }


    // ========================================================
    // TEMPLATE DATA
    // ========================================================

    const data = {

      bookingId:
        booking._id,

      leadTraveller:
        lead?.name || "-",

      startDate:
        moment(
          booking.startDate
        ).format(
          "DD MMM YYYY"
        ),

      endDate:
        moment(
          booking.endDate
        ).format(
          "DD MMM YYYY"
        ),

      hotelName:
        booking.hotelId
          ?.hotelName ||
        "-",

      vehicle:
        vehicleHtml,

      totalPeople:
        booking.totalTraveller ||
        0,

      roomType:
        booking.hotelDetails
          ?.roomType ||
        booking.costBreakup
          ?.hotelBreakdown
          ?.map(
            h =>
              h.roomType
          )
          ?.filter(Boolean)
          ?.join(", ") ||
        "-",

      destinations:
        (
          pkg.destinationCity ||
          []
        ).join(", ") ||
        "-",

      logo:
        logoUrl

    };


    // ========================================================
    // REPLACE TEMPLATE VARIABLES
    // ========================================================

    Object.keys(data)
      .forEach(key => {

        html =
          html.replace(
            new RegExp(
              `{{${key}}}`,
              "g"
            ),
            data[key]
          );

      });


    return generatePDF(
      html,
      `voucher-${booking._id}.pdf`
    );

  };


// ============================================================
// GENERATE ITINERARY PDF
// ============================================================

const generateItineraryPDF =
  async ({
    booking
  }) => {

    let html =
      fs.readFileSync(
        path.join(
          __dirname,
          "../templates/itinerary.html"
        ),
        "utf-8"
      );


    const logoUrl =
      "https://vcrngnmxatijvigekyvc.supabase.co/storage/v1/object/public/logo/logo.png";


    const itinerary =
      booking.holidayPackageId
        ?.itinerary || [];


    const itineraryHtml =
      itinerary
        .map(day => {

          return `
            <div class="day-card">

              <div class="day-header">

                <div>

                  <div class="day-title">
                    Day ${day.dayNo} -
                    ${day.title || ""}
                  </div>

                  <div class="location">
                    ${day.city?.name || ""}
                    ${
                      day.state?.name
                        ? ", " +
                          day.state.name
                        : ""
                    }
                  </div>

                </div>

                <div class="day-badge">
                  Day ${day.dayNo}
                </div>

              </div>


              ${
                day.description
                  ? `
                    <div class="description">
                      ${day.description}
                    </div>
                  `
                  : ""
              }


              ${
                day.mealsIncluded?.length
                  ? `
                    <div class="section">

                      <div class="section-title">
                        🍽 Meals
                      </div>

                      ${day.mealsIncluded
                        .map(
                          m =>
                            `<span class="tag">${m}</span>`
                        )
                        .join("")}

                    </div>
                  `
                  : ""
              }


              ${
                day.activities?.length
                  ? `
                    <div class="section">

                      <div class="section-title">
                        🎯 Activities
                      </div>

                      ${day.activities
                        .map(
                          a =>
                            `<span class="tag">${a.title}</span>`
                        )
                        .join("")}

                    </div>
                  `
                  : ""
              }


              ${
                day.transport?.type
                  ? `
                    <div class="section">

                      <div class="section-title">
                        🚗 Transport
                      </div>

                      <span class="tag">
                        ${day.transport.type}
                      </span>

                    </div>
                  `
                  : ""
              }


              ${
                day.stay &&
                day.hotels?.length
                  ? `
                    <div class="section">

                      <div class="section-title">
                        🏨 Stay
                      </div>

                      <span class="tag">
                        ${day.hotels[0].hotelName}
                      </span>

                    </div>
                  `
                  : ""
              }

            </div>
          `;

        })
        .join("");


    html =
      html

        .replace(
          "{{itinerary}}",
          itineraryHtml
        )

        .replace(
          "{{startDate}}",
          moment(
            booking.startDate
          ).format(
            "DD MMM YYYY"
          )
        )

        .replace(
          "{{endDate}}",
          moment(
            booking.endDate
          ).format(
            "DD MMM YYYY"
          )
        )

        .replace(
          "{{logo}}",
          logoUrl
        );


    return generatePDF(
      html,
      `itinerary-${booking._id}.pdf`
    );

  };


module.exports = {
  generateVoucherPDF,
  generateItineraryPDF
};