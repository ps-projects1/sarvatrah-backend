const { hotelCollection } = require("../models/hotel");

async function calculateRecommendedPackagePrice(
  itinerary,
  vehicles,
  inflatedPercentage
) {

  let hotelCost = 0;

  const selectedHotels = [];

  for (const item of itinerary) {

    if (!item.stay || !item.hotel_id) {
      continue;
    }

    const hotel =
      await hotelCollection.findById(
        item.hotel_id
      );

    if (!hotel) continue;

    const room =
  hotel.rooms.find(
    r =>
      r.roomType?.toLowerCase().trim() ===
      item.recommendedRoomType?.toLowerCase().trim()
  );

    if (!room) continue;

    const occupancyIndex =
      Number(
        item.recommendedOccupancy
      ) - 1;

    const roomPrice =
      room.occupancyRates[
        occupancyIndex
      ] || 0;

    hotelCost += roomPrice;

    selectedHotels.push({
      dayNo: item.dayNo,
      hotelId: hotel._id,
      hotelName: hotel.hotelName,
      roomType:
        item.recommendedRoomType,
      occupancy:
        item.recommendedOccupancy,
      pricePerNight: roomPrice,
    });
  }

  let vehicleCost = 0;

  let selectedVehicle = null;

  if (
    vehicles &&
    vehicles.length
  ) {

    vehicleCost =
      Number(
        vehicles[0].price || 0
      );

    selectedVehicle = {
      vehicle_id:
        vehicles[0].vehicle_id,
      vehicleType:
        vehicles[0].vehicleType,
      price:
        vehicles[0].price,
    };
  }

  const subtotal =
    hotelCost + vehicleCost;

  const inflatedAmount =
    (
      subtotal *
      Number(
        inflatedPercentage || 0
      )
    ) / 100;

  const finalCost =
    subtotal + inflatedAmount;

  return {
    hotelCost,
    vehicleCost,
    subtotal,
    inflatedPercentage,
    inflatedAmount,
    finalCost,
    selectedHotels,
    selectedVehicle,
  };
}

module.exports = {
  calculateRecommendedPackagePrice,
};