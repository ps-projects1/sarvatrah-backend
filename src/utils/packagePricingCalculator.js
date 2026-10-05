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
 * This follows the same pricing rules as calculatePackageCostInternal().
 *
 * Default assumptions:
 * - 1 traveller
 * - occupancy = 1
 * - childWithBed = false
 * - childWithoutBed = false
 * - nights = itinerary item's nights if available, otherwise 1
 * - one vehicle
 */
async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  priceMarkup = 0,
  inflatedPercentage = 0
) {
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
    if (!item?.stay) {
      continue;
    }

    if (!Array.isArray(item.hotels) || !item.hotels.length) {
      continue;
    }

    let cheapestHotel = null;
    let cheapestRoom = null;
    let cheapestOccupancyRate = Number.MAX_SAFE_INTEGER;

    // ------------------------------------------------------------
    // Find cheapest valid hotel for this itinerary day
    // ------------------------------------------------------------

    for (const hotelOption of item.hotels) {
      if (!hotelOption?.hotel_id) {
        continue;
      }

      const hotel = await hotelCollection.findById(
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

        // Same occupancy logic as calculatePackageCostInternal()
        const occupancy = 1;

        const occupancyIndex = occupancy - 1;

        const occupancyRate =
          room.occupancyRates?.[occupancyIndex];

        if (
          occupancyRate === undefined ||
          occupancyRate === null
        ) {
          continue;
        }

        const numericOccupancyRate =
          Number(occupancyRate);

        if (
          !Number.isFinite(numericOccupancyRate) ||
          numericOccupancyRate < 0
        ) {
          continue;
        }

        if (
          numericOccupancyRate <
          cheapestOccupancyRate
        ) {
          cheapestOccupancyRate =
            numericOccupancyRate;

          cheapestHotel = hotel;
          cheapestRoom = room;
        }
      }
    }

    // ------------------------------------------------------------
    // No valid hotel found
    // ------------------------------------------------------------

    if (
      !cheapestHotel ||
      !cheapestRoom
    ) {
      continue;
    }

    // ------------------------------------------------------------
    // Default room calculation
    // Same logic as calculatePackageCostInternal()
    // ------------------------------------------------------------

    const occupancy = 1;

    const requiredRooms = Math.ceil(
      travellerCount / occupancy
    );

    const nights = Number(
      item.nights || 1
    );

    if (nights <= 0) {
      continue;
    }

    const childTotal = 0;

    const perNightRoomPrice =
      cheapestOccupancyRate +
      childTotal;

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

      hotelId:
        cheapestHotel._id,

      hotelName:
        cheapestHotel.hotelName,

      roomType:
        cheapestRoom.roomType,

      occupancy,

      occupancyRate:
        cheapestOccupancyRate,

      requiredRooms,

      nights,

      perNightRoomPrice,

      totalRoomPrice,
    });
  }

  // ============================================================
  // VEHICLE CALCULATION
  // ============================================================

  if (
    Array.isArray(vehicles) &&
    vehicles.length
  ) {
    const validVehicles = [];

    for (const vehicleData of vehicles) {
      if (!vehicleData?.vehicle_id) {
        continue;
      }

      const vehicle =
        await vehicleCollection.findById(
          vehicleData.vehicle_id
        );

      if (!vehicle || !vehicle.active) {
        continue;
      }

      const seatLimit = Number(
        vehicle.seatLimit ||
        vehicleData.seatLimit ||
        0
      );

      // For default package price:
      // 1 traveller must fit in the vehicle.
      if (
        seatLimit > 0 &&
        seatLimit < travellerCount
      ) {
        continue;
      }

      const baseVehiclePrice =
        Number(
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

    const cheapestVehicle =
      validVehicles[0];

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

        price:
          vehicleCost,

        seatLimit:
          cheapestVehicle.seatLimit,

        inventory:
          Number(
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

        price:
          vehicleCost,

        seatLimit:
          cheapestVehicle.seatLimit,

        inventory:
          Number(
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
  // ============================================================

  const packageInflation =
    Number(inflatedPercentage || 0);

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