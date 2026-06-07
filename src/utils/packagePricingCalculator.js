const { hotelCollection } = require("../models/hotel");

const normalize = (str = "") =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  inflatedPercentage = 0
) {

  let hotelCost = 0;

  const selectedHotels = [];

  for (const item of itinerary) {

    if (!item.stay) {
      continue;
    }

    if (
      !Array.isArray(item.hotels) ||
      !item.hotels.length
    ) {
      continue;
    }

    let cheapestHotel = null;
    let cheapestRoom = null;
    let cheapestPrice = Number.MAX_SAFE_INTEGER;

    for (const hotelOption of item.hotels) {

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

        const roomMinPrice =
          Math.min(
            ...room.occupancyRates
          );

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

    if (
      !cheapestHotel ||
      !cheapestRoom
    ) {
      continue;
    }

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

  let vehicleCost = 0;

  let selectedVehicle = null;

  if (
    Array.isArray(vehicles) &&
    vehicles.length
  ) {

    const cheapestVehicle =
      vehicles.sort(
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

  const subtotal =
    hotelCost +
    vehicleCost;

  const inflatedAmount =
    (
      subtotal *
      Number(
        inflatedPercentage || 0
      )
    ) / 100;

  const finalCost =
    subtotal +
    inflatedAmount;

  return {
    hotelCost,
    vehicleCost,
    subtotal,
    inflatedPercentage:
      Number(
        inflatedPercentage || 0
      ),
    inflatedAmount,
    finalCost,
    selectedHotels,
    selectedVehicle,
  };
}

module.exports = {
  calculateRecommendedPackagePrice,
};