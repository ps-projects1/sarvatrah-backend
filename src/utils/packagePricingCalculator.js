const { hotelCollection } = require("../models/hotel");

const normalize = (str = "") =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

async function calculateRecommendedPackagePrice(
  itinerary = [],
  vehicles = [],
  inflatedPercentage = 0
) {

  let hotelCost = 0;

  const selectedHotels = [];

  // console.log(
  //   "Calculating package price with itinerary:",
  //   JSON.stringify(itinerary)
  // );

  for (const item of itinerary) {

    if (!item.stay || !item.hotel_id) {
      continue;
    }

    const hotel =
      await hotelCollection.findById(
        item.hotel_id
      );

    if (!hotel) {
      console.log(
        `Hotel not found: ${item.hotel_id}`
      );
      continue;
    }

    if (!hotel.active) {
      console.log(
        `Hotel inactive: ${hotel.hotelName}`
      );
      continue;
    }

    // --------------------------------------------------
    // RECOMMENDED ROOM TYPE
    // --------------------------------------------------

    let room = null;

    if (item.recommendedRoomType) {

      room = hotel.rooms.find(
        r =>
          normalize(r.roomType) ===
          normalize(
            item.recommendedRoomType
          )
      );
    }

    // --------------------------------------------------
    // FALLBACK -> CHEAPEST ROOM
    // --------------------------------------------------

    if (!room) {

      room =
        hotel.rooms
          ?.filter(
            r =>
              Array.isArray(
                r.occupancyRates
              ) &&
              r.occupancyRates.length
          )
          .sort((a, b) => {

            const aMin =
              Math.min(
                ...a.occupancyRates
              );

            const bMin =
              Math.min(
                ...b.occupancyRates
              );

            return aMin - bMin;

          })?.[0];
    }

    if (!room) {

      console.log(
        `No valid room pricing found for hotel ${hotel.hotelName}`
      );

      continue;
    }

    // --------------------------------------------------
    // OCCUPANCY
    // --------------------------------------------------

    const occupancy =
      Number(
        item.recommendedOccupancy
      ) || 1;

    const occupancyIndex =
      occupancy - 1;

    let occupancyRate =
      room.occupancyRates?.[
        occupancyIndex
      ];

    // --------------------------------------------------
    // FALLBACK TO CHEAPEST OCCUPANCY
    // --------------------------------------------------

    if (
      occupancyRate === undefined ||
      occupancyRate === null
    ) {

      occupancyRate =
        Math.min(
          ...room.occupancyRates
        );
    }

    occupancyRate =
      Number(
        occupancyRate || 0
      );

    hotelCost += occupancyRate;

    selectedHotels.push({

      dayNo:
        item.dayNo,

      hotelId:
        hotel._id,

      hotelName:
        hotel.hotelName,

      roomType:
        room.roomType,

      occupancy,

      pricePerNight:
        occupancyRate,
    });

    console.log({
      hotel: hotel.hotelName,
      roomType: room.roomType,
      occupancy,
      occupancyRate,
    });
  }

  // ==================================================
  // VEHICLE COST
  // ==================================================

  let vehicleCost = 0;

  let selectedVehicle = null;

  if (
    Array.isArray(vehicles) &&
    vehicles.length
  ) {

    const vehicle =
      vehicles[0];

    vehicleCost =
      Number(
        vehicle.price || 0
      );

    selectedVehicle = {

      vehicle_id:
        vehicle.vehicle_id,

      vehicleType:
        vehicle.vehicleType,

      price:
        vehicleCost,
    };
  }

  // ==================================================
  // FINAL COST
  // ==================================================

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

  console.log({
    hotelCost,
    vehicleCost,
    subtotal,
    inflatedAmount,
    finalCost,
  });

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