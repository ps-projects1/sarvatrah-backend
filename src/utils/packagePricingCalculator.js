const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");

const normalize = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Supports itinerary city/state values stored as either:
 * - Strings
 * - Objects containing name
 *
 * Example:
 * city: { name: "Shimla" }
 * state: { name: "Himachal Pradesh" }
 */
const getLocationName = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value.name ||
      value.city ||
      value.state ||
      ""
    ).trim();
  }

  return String(value).trim();
};

/**
 * Calculate the default/recommended package price for one traveller.
 *
 * HOTEL SELECTION:
 * - Only itinerary days with stay === true contribute hotel costs.
 * - Search the separate Hotel collection.
 * - Match hotels using the itinerary day's city and state.
 * - Consider active hotels only.
 * - Find the cheapest valid room across all matching hotels.
 * - Do not use recommendedRoomType or recommendedOccupancy.
 * - Do not restrict the search to item.hotels.
 * - Use occupancyRates[0] as the single-traveller price.
 *
 * EXISTING DEFAULT ASSUMPTIONS:
 * - One traveller
 * - Occupancy 1
 * - No children
 * - Nights from item.nights, otherwise 1
 * - One cheapest eligible vehicle
 *
 * This function is for recommended package pricing only.
 * It does not replace the runtime booking-cost calculator.
 */
async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  priceMarkup = 0,
  inflatedPercentage = 0
) {
  const travellerCount = 1;
  const occupancy = 1;

  let hotelCost = 0;
  let vehicleCost = 0;

  const hotelBreakdown = [];
  const selectedHotels = [];

  const vehicleBreakdown = [];
  let selectedVehicle = null;

  // ============================================================
  // HOTEL CALCULATION
  // ============================================================

  for (const item of itinerary) {
    // Only stay days contribute hotel costs.
    if (!item?.stay) {
      continue;
    }

    // The itinerary's city and state determine which hotels
    // are eligible for this stay day.
    const itineraryCity = getLocationName(item.city);
    const itineraryState = getLocationName(item.state);

    if (!itineraryCity || !itineraryState) {
      throw new Error(
        `City and state are required for stay day ${item.dayNo ?? "unknown"
        }`
      );
    }

    const normalizedCity = normalize(itineraryCity);
    const normalizedState = normalize(itineraryState);

    // ------------------------------------------------------------
    // Find all active hotels in the Hotel collection.
    //
    // Do not use item.hotels here. The search must cover the
    // entire Hotel collection, not only configured hotel options.
    // ------------------------------------------------------------

    const allActiveHotels = await hotelCollection.find({
      active: true,
    });

    const matchingHotels = allActiveHotels.filter((hotel) => {
      const hotelCity = normalize(hotel.city);
      const hotelState = normalize(hotel.state);

      return (
        hotelCity === normalizedCity &&
        hotelState === normalizedState
      );
    });

    if (matchingHotels.length === 0) {
      throw new Error(
        `No active hotels found in ${itineraryCity}, ${itineraryState} ` +
        `for stay day ${item.dayNo ?? "unknown"}`
      );
    }

    // ------------------------------------------------------------
    // Find the cheapest valid room across all matching hotels.
    //
    // recommendedRoomType and recommendedOccupancy are
    // intentionally not used.
    // ------------------------------------------------------------

    let cheapestHotel = null;
    let cheapestRoom = null;
    let cheapestRoomRate = Number.POSITIVE_INFINITY;

    for (const hotel of matchingHotels) {
      for (const room of hotel.rooms || []) {
        if (
          !Array.isArray(room.occupancyRates) ||
          room.occupancyRates.length === 0
        ) {
          continue;
        }

        // Preserve the existing default pricing assumption:
        // occupancy 1 corresponds to occupancyRates[0].
        const rate = room.occupancyRates[0];

        if (
          rate === undefined ||
          rate === null ||
          rate === ""
        ) {
          continue;
        }

        const numericRate = Number(rate);

        if (
          !Number.isFinite(numericRate) ||
          numericRate < 0
        ) {
          continue;
        }

        if (numericRate < cheapestRoomRate) {
          cheapestRoomRate = numericRate;
          cheapestHotel = hotel;
          cheapestRoom = room;
        }
      }
    }

    if (!cheapestHotel || !cheapestRoom) {
      throw new Error(
        `No valid room price found in ${itineraryCity}, ${itineraryState} ` +
        `for stay day ${item.dayNo ?? "unknown"}`
      );
    }

    // ------------------------------------------------------------
    // Calculate the price for this stay day.
    // ------------------------------------------------------------

    const requiredRooms = Math.ceil(
      travellerCount / occupancy
    );

    const nights = Number(item.nights || 1);

    if (!Number.isFinite(nights) || nights <= 0) {
      throw new Error(
        `Invalid nights value for stay day ${item.dayNo ?? "unknown"
        }`
      );
    }

    // Default recommended pricing does not include children.
    const childTotal = 0;

    const perNightRoomPrice =
      cheapestRoomRate + childTotal;

    const totalRoomPrice =
      perNightRoomPrice *
      nights *
      requiredRooms;

    hotelCost += totalRoomPrice;

    // ------------------------------------------------------------
    // Store the selected hotel in recommendedPricing.
    // ------------------------------------------------------------

    selectedHotels.push({
      dayNo: item.dayNo,
      hotelId: cheapestHotel._id,
      hotelName: cheapestHotel.hotelName,
      roomType: cheapestRoom.roomType,
      occupancy,
      pricePerNight: cheapestRoomRate,
      nights,
    });

    // ------------------------------------------------------------
    // Hotel pricing breakdown.
    // ------------------------------------------------------------

    hotelBreakdown.push({
      dayNo: item.dayNo,
      city: itineraryCity,
      state: itineraryState,
      hotelId: cheapestHotel._id,
      hotelName: cheapestHotel.hotelName,
      roomType: cheapestRoom.roomType,
      occupancy,
      occupancyRate: cheapestRoomRate,
      requiredRooms,
      nights,
      perNightRoomPrice,
      totalRoomPrice,
    });
  }

  // ============================================================
  // VEHICLE CALCULATION
  // Existing vehicle-selection logic is preserved.
  // ============================================================

  if (Array.isArray(vehicles) && vehicles.length > 0) {
    const validVehicles = [];

    for (const vehicleData of vehicles) {
      if (!vehicleData?.vehicle_id) {
        continue;
      }

      const vehicle = await vehicleCollection.findById(
        vehicleData.vehicle_id
      );

      if (!vehicle || !vehicle.active) {
        continue;
      }

      const seatLimit = Number(
        vehicle.seatLimit ??
        vehicleData.seatLimit ??
        0
      );

      // One traveller must fit in the vehicle.
      if (
        seatLimit > 0 &&
        seatLimit < travellerCount
      ) {
        continue;
      }

      const baseVehiclePrice = Number(
        vehicleData.price ??
        vehicle.rate ??
        0
      );

      if (
        !Number.isFinite(baseVehiclePrice) ||
        baseVehiclePrice < 0
      ) {
        continue;
      }

      validVehicles.push({
        vehicleData,
        vehicle,
        seatLimit,
        baseVehiclePrice,
      });
    }

    // Select the cheapest valid vehicle.
    validVehicles.sort(
      (a, b) =>
        a.baseVehiclePrice - b.baseVehiclePrice
    );

    const cheapestVehicle = validVehicles[0];

    if (cheapestVehicle) {
      vehicleCost = cheapestVehicle.baseVehiclePrice;

      selectedVehicle = {
        vehicle_id:
          cheapestVehicle.vehicleData.vehicle_id,

        vehicleType:
          cheapestVehicle.vehicleData.vehicleType ||
          cheapestVehicle.vehicle.vehicleType,

        brandName:
          cheapestVehicle.vehicleData.brandName ||
          cheapestVehicle.vehicle.brandName,

        modelName:
          cheapestVehicle.vehicleData.modelName ||
          cheapestVehicle.vehicle.modelName,

        price: vehicleCost,

        seatLimit: cheapestVehicle.seatLimit,

        inventory: Number(
          cheapestVehicle.vehicle.inventory || 0
        ),
      };

      vehicleBreakdown.push({
        vehicleId:
          cheapestVehicle.vehicleData.vehicle_id,

        vehicleType:
          cheapestVehicle.vehicleData.vehicleType ||
          cheapestVehicle.vehicle.vehicleType ||
          "",

        brandName:
          cheapestVehicle.vehicleData.brandName ||
          cheapestVehicle.vehicle.brandName ||
          "",

        modelName:
          cheapestVehicle.vehicleData.modelName ||
          cheapestVehicle.vehicle.modelName ||
          "",

        price: vehicleCost,

        seatLimit: cheapestVehicle.seatLimit,

        inventory: Number(
          cheapestVehicle.vehicle.inventory || 0
        ),
      });
    }
  }

  // ============================================================
  // PACKAGE SUBTOTAL
  // ============================================================

  const subtotal = hotelCost + vehicleCost;

  // ============================================================
  // PACKAGE MARKUP
  // Existing calculation is preserved.
  // ============================================================

  const markup = Number(priceMarkup || 0);

  const markupAmount =
    (subtotal * markup) / 100;

  const subtotalAfterMarkup =
    subtotal + markupAmount;

  // ============================================================
  // PACKAGE DISCOUNT
  //
  // Preserve the existing behavior: inflatedPercentage is
  // currently subtracted as a discount.
  // ============================================================

  const packageInflation =
    Number(inflatedPercentage || 0);

  const inflatedAmount =
    (subtotalAfterMarkup * packageInflation) / 100;

  const finalCost =
    subtotalAfterMarkup - inflatedAmount;

  // ============================================================
  // RESPONSE
  // ============================================================

  return {
    hotelCost,
    vehicleCost,
    subtotal,
    markup,
    markupAmount,
    subtotalAfterMarkup,
    inflatedPercentage: packageInflation,
    inflatedAmount,
    finalCost,
    selectedHotels,
    selectedVehicle,
    hotelBreakdown,
    vehicleBreakdown,
    totalTraveller: travellerCount,
    totalVehicles: selectedVehicle ? 1 : 0,
  };
}

module.exports = {
  calculateRecommendedPackagePrice,
};