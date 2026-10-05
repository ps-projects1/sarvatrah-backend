const { hotelCollection } = require("../models/hotel");
const { vehicleCollection } = require("../models/vehicle");

const normalize = (str = "") =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Calculate default/recommended package price for 1 traveller.
 *
 * IMPORTANT:
 * This function is ONLY for calculating the default/recommended
 * package price when the holiday package is created/updated.
 *
 * It is NOT the same as calculatePackageCostInternal().
 *
 * Default assumptions:
 * - 1 traveller
 * - childWithBed = false
 * - childWithoutBed = false
 * - nights = itinerary item's nights if available, otherwise 1
 * - one vehicle
 *
 * HOTEL SELECTION:
 * - For every stay day, inspect every configured hotel.
 * - Only consider the itinerary's recommendedRoomType.
 * - Use the itinerary's recommendedOccupancy.
 * - Select the cheapest valid hotel for that day.
 *
 * VEHICLE SELECTION:
 * - Select the cheapest valid vehicle that can accommodate
 *   the default traveller count.
 */
async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  priceMarkup = 0,
  inflatedPercentage = 0
) {
  // ============================================================
  // DEFAULT PACKAGE ASSUMPTIONS
  // ============================================================

  const travellerCount = 1;

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
    // Only stay days contribute hotel cost.
    if (!item?.stay) {
      continue;
    }

    if (!Array.isArray(item.hotels) || item.hotels.length === 0) {
      throw new Error(
        `No hotels configured for stay day ${item.dayNo ?? "unknown"}`
      );
    }

    // ------------------------------------------------------------
    // Recommended room type and occupancy
    // ------------------------------------------------------------

    const occupancy = Number(item.recommendedOccupancy || 1);

    const recommendedRoomType = item.recommendedRoomType
      ? String(item.recommendedRoomType).trim()
      : "";

    if (!Number.isInteger(occupancy) || occupancy <= 0) {
      throw new Error(
        `Invalid recommended occupancy for stay day ${
          item.dayNo ?? "unknown"
        }`
      );
    }

    // ------------------------------------------------------------
    // Find cheapest valid room across all hotels for this day
    //
    // Only:
    // - recommendedRoomType
    // - recommendedOccupancy
    // are considered.
    // ------------------------------------------------------------

    let cheapestHotel = null;
    let cheapestRoom = null;
    let cheapestOccupancyRate = Number.POSITIVE_INFINITY;

    for (const hotelOption of item.hotels) {
      if (!hotelOption?.hotel_id) {
        continue;
      }

      const hotel = await hotelCollection.findById(hotelOption.hotel_id);

      if (!hotel || !hotel.active) {
        continue;
      }

      // ----------------------------------------------------------
      // Find the CHEAPEST valid recommended room in this hotel.
      // ----------------------------------------------------------

      let hotelCheapestRoom = null;
      let hotelCheapestRate = Number.POSITIVE_INFINITY;

      for (const room of hotel.rooms || []) {
        // --------------------------------------------------------
        // Filter by recommended room type.
        //
        // Example:
        // recommendedRoomType = "Standard"
        //
        // Only Standard rooms are considered.
        // --------------------------------------------------------

        if (
          recommendedRoomType &&
          normalize(room.roomType) !== normalize(recommendedRoomType)
        ) {
          continue;
        }

        if (
          !Array.isArray(room.occupancyRates) ||
          room.occupancyRates.length === 0
        ) {
          continue;
        }

        // --------------------------------------------------------
        // Use recommended occupancy.
        //
        // occupancy 1 -> occupancyRates[0]
        // occupancy 2 -> occupancyRates[1]
        // occupancy 3 -> occupancyRates[2]
        // etc.
        // --------------------------------------------------------

        const occupancyIndex = occupancy - 1;

        const occupancyRate = room.occupancyRates[occupancyIndex];

        if (
          occupancyRate === undefined ||
          occupancyRate === null ||
          occupancyRate === ""
        ) {
          continue;
        }

        const numericOccupancyRate = Number(occupancyRate);

        if (
          !Number.isFinite(numericOccupancyRate) ||
          numericOccupancyRate < 0
        ) {
          continue;
        }

        // Keep the cheapest matching room inside this hotel.
        if (numericOccupancyRate < hotelCheapestRate) {
          hotelCheapestRate = numericOccupancyRate;
          hotelCheapestRoom = room;
        }
      }

      // No valid recommended room in this hotel.
      if (!hotelCheapestRoom) {
        continue;
      }

      // ----------------------------------------------------------
      // Compare this hotel's cheapest recommended room against
      // all other hotels for this day.
      // ----------------------------------------------------------

      if (hotelCheapestRate < cheapestOccupancyRate) {
        cheapestOccupancyRate = hotelCheapestRate;
        cheapestHotel = hotel;
        cheapestRoom = hotelCheapestRoom;
      }
    }

    // ------------------------------------------------------------
    // No valid hotel found
    // ------------------------------------------------------------

    if (!cheapestHotel || !cheapestRoom) {
      throw new Error(
        `No valid hotel room found for stay day ${
          item.dayNo ?? "unknown"
        } with room type "${
          recommendedRoomType || "any"
        }" and occupancy ${occupancy}`
      );
    }

    // ------------------------------------------------------------
    // Default room calculation
    // ------------------------------------------------------------

    const requiredRooms = Math.ceil(travellerCount / occupancy);

    const nights = Number(item.nights || 1);

    if (!Number.isFinite(nights) || nights <= 0) {
      throw new Error(
        `Invalid nights value for stay day ${item.dayNo ?? "unknown"}`
      );
    }

    // Default package calculation has no children.
    const childTotal = 0;

    const perNightRoomPrice =
      cheapestOccupancyRate + childTotal;

    const totalRoomPrice =
      perNightRoomPrice *
      nights *
      requiredRooms;

    hotelCost += totalRoomPrice;

    // ------------------------------------------------------------
    // Selected hotel
    // ------------------------------------------------------------

    selectedHotels.push({
      dayNo: item.dayNo,
      hotelId: cheapestHotel._id,
      hotelName: cheapestHotel.hotelName,
      roomType: cheapestRoom.roomType,
      occupancy,
      nights,
    });

    // ------------------------------------------------------------
    // Hotel breakdown
    // ------------------------------------------------------------

    hotelBreakdown.push({
      dayNo: item.dayNo,

      hotelId: cheapestHotel._id,

      hotelName: cheapestHotel.hotelName,

      roomType: cheapestRoom.roomType,

      occupancy,

      occupancyRate: cheapestOccupancyRate,

      requiredRooms,

      nights,

      perNightRoomPrice,

      totalRoomPrice,
    });
  }

  // ============================================================
  // VEHICLE CALCULATION
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

    // ------------------------------------------------------------
    // Select cheapest valid vehicle
    // ------------------------------------------------------------

    validVehicles.sort(
      (a, b) =>
        a.baseVehiclePrice -
        b.baseVehiclePrice
    );

    const cheapestVehicle = validVehicles[0];

    if (cheapestVehicle) {
      vehicleCost =
        cheapestVehicle.baseVehiclePrice;

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

        seatLimit:
          cheapestVehicle.seatLimit,

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

        seatLimit:
          cheapestVehicle.seatLimit,

        inventory: Number(
          cheapestVehicle.vehicle.inventory || 0
        ),
      });
    }
  }

  // ============================================================
  // PACKAGE SUBTOTAL
  // ============================================================

  const subtotal =
    hotelCost +
    vehicleCost;

  // ============================================================
  // PACKAGE MARKUP
  // ============================================================

  const markup =
    Number(priceMarkup || 0);

  const markupAmount =
    (subtotal * markup) / 100;

  const subtotalAfterMarkup =
    subtotal +
    markupAmount;

  // ============================================================
  // PACKAGE DISCOUNT
  //
  // NOTE:
  // Despite the existing field name `inflatedPercentage`,
  // the current business logic uses this percentage as a
  // discount from subtotalAfterMarkup.
  // ============================================================

  const packageInflation =
    Number(inflatedPercentage || 0);

  const inflatedAmount =
    (subtotalAfterMarkup * packageInflation) / 100;

  const finalCost =
    subtotalAfterMarkup -
    inflatedAmount;

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

    inflatedPercentage:
      packageInflation,

    inflatedAmount,

    finalCost,

    selectedHotels,

    selectedVehicle,

    hotelBreakdown,

    vehicleBreakdown,

    totalTraveller:
      travellerCount,

    totalVehicles:
      selectedVehicle ? 1 : 0,
  };
}

module.exports = {
  calculateRecommendedPackagePrice,
};