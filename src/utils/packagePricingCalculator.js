const { hotelCollection } = require("../models/hotel");

const normalize = (str = "") =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Calculate the recommended holiday package price.
 *
 * Pricing flow:
 *
 * 1. Calculate all selected/recommended hotel costs
 * 2. Calculate cheapest vehicle cost
 * 3. Base package cost = hotelCost + vehicleCost
 * 4. Apply package priceMarkup (%) to the whole package cost
 * 5. Apply inflatedPercentage (%) as a discount to the amount after markup
 * 6. finalCost = subtotalAfterMarkup - inflatedAmount
 *
 * IMPORTANT:
 * - priceMarkup is NOT applied to vehicle separately.
 * - inflatedPercentage is treated as a discount.
 */
async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  priceMarkup = 0,
  inflatedPercentage = 0
) {
  let hotelCost = 0;

  const selectedHotels = [];

  // ============================================================
  // HOTEL CALCULATION
  // ============================================================

  for (const item of itinerary) {
    // Only calculate hotels for days where stay is enabled
    if (!item.stay) {
      continue;
    }

    // No hotel options for this day
    if (
      !Array.isArray(item.hotels) ||
      !item.hotels.length
    ) {
      continue;
    }

    let cheapestHotel = null;
    let cheapestRoom = null;
    let cheapestPrice = Number.MAX_SAFE_INTEGER;

    // ------------------------------------------------------------
    // Find cheapest active hotel + room for this itinerary day
    // ------------------------------------------------------------

    for (const hotelOption of item.hotels) {
      if (!hotelOption.hotel_id) {
        continue;
      }

      const hotel =
        await hotelCollection.findById(
          hotelOption.hotel_id
        );

      if (!hotel || !hotel.active) {
        continue;
      }

      for (const room of hotel.rooms || []) {
        if (
          !Array.isArray(room.occupancyRates) ||
          !room.occupancyRates.length
        ) {
          continue;
        }

        const validRates =
          room.occupancyRates
            .map(Number)
            .filter(
              (price) =>
                Number.isFinite(price) &&
                price >= 0
            );

        if (!validRates.length) {
          continue;
        }

        const roomMinPrice =
          Math.min(...validRates);

        if (
          roomMinPrice <
          cheapestPrice
        ) {
          cheapestPrice =
            roomMinPrice;

          cheapestHotel =
            hotel;

          cheapestRoom =
            room;
        }
      }
    }

    // ------------------------------------------------------------
    // No valid hotel found for this day
    // ------------------------------------------------------------

    if (
      !cheapestHotel ||
      !cheapestRoom
    ) {
      continue;
    }

    // Add cheapest room price for this day
    hotelCost += cheapestPrice;

    selectedHotels.push({
      dayNo: item.dayNo,

      hotelId:
        cheapestHotel._id,

      hotelName:
        cheapestHotel.hotelName,

      roomType:
        cheapestRoom.roomType,

      occupancy: 1,

      pricePerNight:
        cheapestPrice,
    });
  }

  // ============================================================
  // VEHICLE CALCULATION
  // ============================================================

  let vehicleCost = 0;

  let selectedVehicle = null;

  if (
    Array.isArray(vehicles) &&
    vehicles.length
  ) {
    // Do not mutate the original vehicles array
    const cheapestVehicle =
      [...vehicles].sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      )[0];

    vehicleCost =
      Number(
        cheapestVehicle.price || 0
      );

    selectedVehicle = {
      vehicle_id:
        cheapestVehicle.vehicle_id,

      vehicleType:
        cheapestVehicle.vehicleType,

      price:
        vehicleCost,
    };
  }

  // ============================================================
  // PACKAGE PRICING
  // ============================================================

  /*
   * IMPORTANT:
   *
   * priceMarkup belongs to the whole holiday package.
   *
   * Base package cost:
   *
   * hotelCost + vehicleCost
   */

  const subtotal =
    hotelCost +
    vehicleCost;

  // ------------------------------------------------------------
  // PACKAGE MARKUP
  // ------------------------------------------------------------

  const markup =
    Number(priceMarkup || 0);

  const markupAmount =
    (
      subtotal *
      markup
    ) / 100;

  const subtotalAfterMarkup =
    subtotal +
    markupAmount;

  // ------------------------------------------------------------
  // PACKAGE INFLATED PERCENTAGE
  //
  // IMPORTANT:
  // Client clarified this is actually a DISCOUNT.
  //
  // Therefore it must be SUBTRACTED.
  // ------------------------------------------------------------

  const packageInflation =
    Number(
      inflatedPercentage || 0
    );

  const inflatedAmount =
    (
      subtotalAfterMarkup *
      packageInflation
    ) / 100;

  const finalCost =
    subtotalAfterMarkup -
    inflatedAmount;

  // ============================================================
  // RESPONSE
  // ============================================================

  return {
    hotelCost,

    vehicleCost,

    // Cost before package markup/discount
    subtotal,

    // Package markup
    markup,

    markupAmount,

    // Cost after markup and before discount
    subtotalAfterMarkup,

    // Existing field names preserved for compatibility
    inflatedPercentage:
      packageInflation,

    inflatedAmount,

    // Final package price after discount
    finalCost,

    selectedHotels,

    selectedVehicle,
  };
}

module.exports = {
  calculateRecommendedPackagePrice,
};