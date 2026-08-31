const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { Pilgrimage } = require("../../models/pilgrimage");
const { vehicleCollection } = require("../../models/vehicle");

const {
  writeLog,
} = require("../../utils/debugLogger");

// ======================== HELPERS ========================

const normalize = (str = "") =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// ======================== INTERNAL FUNCTION ===========================

async function calculatePackageCostInternal(body) {
  try {
    const {
      // PACKAGE
      holidayPackageId,
      pilgrimagePackageId,

      // VEHICLES
      // NEW: multiple vehicles
      vehicleIds = [],

      // BACKWARD COMPATIBILITY:
      // Old frontend can still send vehicleId.
      vehicleId,

      // HOTELS
      selectedHotels = [],

      // DATES
      startDate,
      endDate,

      // TRAVELLERS
      totalTraveller = 1,

      // CHILD OPTIONS
      childWithBed = false,
      childWithoutBed = false,
    } = body;

    writeLog({
      type: "Calculation booking request started",
      body: JSON.stringify(body, null, 2),
    });

    // ========================
    // PACKAGE VALIDATION
    // ========================

    const packageId =
      holidayPackageId ||
      pilgrimagePackageId;

    if (!packageId) {
      throw new Error("Package ID is required");
    }

    // ========================
    // FETCH PACKAGE
    // ========================

    let pkg = null;

    if (holidayPackageId) {
      pkg = await HolidayPackage.findById(
        holidayPackageId
      );
    } else {
      pkg = await Pilgrimage.findById(
        pilgrimagePackageId
      );
    }

    if (!pkg) {
      throw new Error("Package not found");
    }

    // ========================
    // DATE VALIDATION
    // ========================

    const bookingStart =
      new Date(startDate);

    const bookingEnd =
      new Date(endDate);

    if (
      isNaN(bookingStart.getTime()) ||
      isNaN(bookingEnd.getTime())
    ) {
      throw new Error(
        "Invalid booking dates"
      );
    }

    const days = Math.ceil(
      (bookingEnd - bookingStart) /
        (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      throw new Error(
        "End date must be after start date"
      );
    }

    // ========================
    // TRAVELLER VALIDATION
    // ========================

    const travellerCount =
      Number(totalTraveller);

    if (
      !Number.isFinite(travellerCount) ||
      travellerCount <= 0
    ) {
      throw new Error(
        "Total traveller must be greater than 0"
      );
    }

    // ========================
    // PACKAGE PRICING
    // ========================

    /*
     * IMPORTANT:
     *
     * priceMarkup belongs to the package.
     *
     * inflatedPercentage belongs to the package
     * and is treated as a discount.
     *
     * Frontend does NOT control these values.
     */

    const packageMarkup =
      Number(pkg.priceMarkup || 0);

    const packageInflation =
      Number(pkg.inflatedPercentage || 0);

    // ========================
    // HOTEL CALCULATION
    // ========================

    let hotelCost = 0;

    const hotelBreakdown = [];

    for (const selectedHotel of selectedHotels) {
      const {
        dayNo,
        hotelId,
        roomType,
        occupancy,
        nights = 1,
      } = selectedHotel;

      // ========================
      // VALIDATIONS
      // ========================

      if (!hotelId) {
        throw new Error(
          `Hotel ID missing for day ${dayNo}`
        );
      }

      if (!roomType) {
        throw new Error(
          `Room type missing for day ${dayNo}`
        );
      }

      if (!occupancy) {
        throw new Error(
          `Occupancy missing for day ${dayNo}`
        );
      }

      if (Number(nights) <= 0) {
        throw new Error(
          `Invalid nights for day ${dayNo}`
        );
      }

      // ========================
      // FETCH HOTEL
      // ========================

      const hotel =
        await hotelCollection.findById(
          hotelId
        );

      if (!hotel) {
        throw new Error(
          `Hotel not found for day ${dayNo}`
        );
      }

      if (!hotel.active) {
        throw new Error(
          `${hotel.hotelName} is inactive`
        );
      }

      // ========================
      // HOTEL BLACKOUT
      // ========================

      if (
        hotel.blackout?.start &&
        hotel.blackout?.end
      ) {
        const blackoutStart =
          new Date(
            hotel.blackout.start
          );

        const blackoutEnd =
          new Date(
            hotel.blackout.end
          );

        const overlaps =
          bookingStart <= blackoutEnd &&
          bookingEnd >= blackoutStart;

        if (overlaps) {
          throw new Error(
            `${hotel.hotelName} unavailable due to blackout`
          );
        }
      }

      // ========================
      // FIND ROOM
      // ========================

      const room =
        hotel.rooms.find(
          (r) =>
            normalize(r.roomType) ===
            normalize(roomType)
        );

      if (!room) {
        throw new Error(
          `${roomType} room not found in ${hotel.hotelName}`
        );
      }

      // ========================
      // ROOM DATE AVAILABILITY
      // ========================

      let roomAvailable = false;

      for (
        const duration of
          room.duration || []
      ) {
        const roomStart =
          new Date(
            duration.startDate
          );

        const roomEnd =
          new Date(
            duration.endDate
          );

        const valid =
          bookingStart >= roomStart &&
          bookingEnd <= roomEnd;

        if (valid) {
          roomAvailable = true;
          break;
        }
      }

      if (
        room.duration?.length > 0 &&
        !roomAvailable
      ) {
        throw new Error(
          `${roomType} unavailable in ${hotel.hotelName} for selected dates`
        );
      }

      // ========================
      // OCCUPANCY RATE
      // ========================

      const occupancyIndex =
        Number(occupancy) - 1;

      const occupancyRate =
        room.occupancyRates?.[
          occupancyIndex
        ];

      if (
        occupancyRate === undefined ||
        occupancyRate === null
      ) {
        throw new Error(
          `Occupancy ${occupancy} pricing missing in ${hotel.hotelName}`
        );
      }

      // ========================
      // REQUIRED ROOM COUNT
      // ========================

      const requiredRooms =
        Math.ceil(
          travellerCount /
            Number(occupancy)
        );

      // ========================
      // INVENTORY VALIDATION
      // ========================

      if (
        Number(room.inventory || 0) <
        requiredRooms
      ) {
        throw new Error(
          `Insufficient room inventory in ${hotel.hotelName}`
        );
      }

      // ========================
      // CHILD COST
      // ========================

      let childTotal = 0;

      if (childWithBed) {
        childTotal += Number(
          room.child
            ?.childWithBedPrice || 0
        );
      }

      if (childWithoutBed) {
        childTotal += Number(
          room.child
            ?.childWithoutBedPrice || 0
        );
      }

      // ========================
      // FINAL ROOM PRICE
      // ========================

      const perNightRoomPrice =
        Number(occupancyRate) +
        Number(childTotal);

      const totalRoomPrice =
        perNightRoomPrice *
        Number(nights) *
        requiredRooms;

      hotelCost += totalRoomPrice;

      // ========================
      // HOTEL BREAKDOWN
      // ========================

      hotelBreakdown.push({
        dayNo,

        hotelId,

        hotelName:
          hotel.hotelName,

        roomType,

        occupancy,

        occupancyRate,

        requiredRooms,

        nights,

        perNightRoomPrice,

        totalRoomPrice,
      });

      console.log({
        hotel: hotel.hotelName,
        roomType,
        occupancy,
        occupancyRate,
        requiredRooms,
        nights,
        totalRoomPrice,
      });
    }

    // ========================
    // VEHICLE CALCULATION
    // ========================

    /*
     * NEW VEHICLE FLOW
     *
     * Frontend sends:
     *
     * vehicleIds: [
     *   "vehicleId1",
     *   "vehicleId2",
     *   "vehicleId3"
     * ]
     *
     * Every selected vehicle is validated
     * and its price is added.
     */

    let selectedVehicleIds = [];

    // ========================
    // NEW vehicleIds
    // ========================

    if (Array.isArray(vehicleIds)) {
      selectedVehicleIds = vehicleIds
        .filter(Boolean)
        .map((id) => String(id));
    }

    // ========================
    // BACKWARD COMPATIBILITY
    // ========================

    /*
     * If old frontend sends:
     *
     * vehicleId: "123"
     *
     * convert it into:
     *
     * vehicleIds: ["123"]
     */

    if (
      selectedVehicleIds.length === 0 &&
      vehicleId
    ) {
      selectedVehicleIds = [
        String(vehicleId),
      ];
    }

    if (
      selectedVehicleIds.length === 0
    ) {
      throw new Error(
        "At least one vehicle is required"
      );
    }

    // ========================
    // VEHICLE TOTALS
    // ========================

    let vehicleCost = 0;

    let totalVehicleSeats = 0;

    const vehicleBreakdown = [];

    // Track quantity of duplicate vehicle IDs.
    //
    // This allows the frontend to send:
    //
    // vehicleIds: [
    //   "sedanId",
    //   "sedanId"
    // ]
    //
    // if two cars of the same vehicle record
    // are required.

    const vehicleQuantityMap = {};

    for (const id of selectedVehicleIds) {
      vehicleQuantityMap[id] =
        (vehicleQuantityMap[id] || 0) + 1;
    }

    // ========================
    // PROCESS EACH VEHICLE
    // ========================

    for (
      const selectedVehicleId of
        selectedVehicleIds
    ) {
      // ========================
      // FIND VEHICLE PRICE
      // ========================

      const vehicleData =
        pkg.availableVehicle?.find(
          (v) =>
            String(v.vehicle_id) ===
            String(selectedVehicleId)
        ) ||
        pkg.vehiclePrices?.find(
          (v) =>
            String(v.vehicle_id) ===
            String(selectedVehicleId)
        );

      if (!vehicleData) {
        throw new Error(
          `Vehicle ${selectedVehicleId} is not available in this package`
        );
      }

      // ========================
      // FETCH VEHICLE
      // ========================

      const vehicle =
        await vehicleCollection.findById(
          selectedVehicleId
        );

      if (!vehicle) {
        throw new Error(
          `Vehicle ${selectedVehicleId} not found`
        );
      }

      if (!vehicle.active) {
        throw new Error(
          `${vehicle.vehicleType || "Selected vehicle"} is inactive`
        );
      }

      // ========================
      // VEHICLE BLACKOUT
      // ========================

      if (
        vehicle.blackout?.start &&
        vehicle.blackout?.end
      ) {
        const blackoutStart =
          new Date(
            vehicle.blackout.start
          );

        const blackoutEnd =
          new Date(
            vehicle.blackout.end
          );

        const overlaps =
          bookingStart <= blackoutEnd &&
          bookingEnd >= blackoutStart;

        if (overlaps) {
          throw new Error(
            `${vehicle.vehicleType || "Selected vehicle"} unavailable due to blackout`
          );
        }
      }

      // ========================
      // VEHICLE INVENTORY
      // ========================

      const requestedQuantity =
        vehicleQuantityMap[
          String(selectedVehicleId)
        ] || 1;

      const vehicleInventory =
        Number(
          vehicle.inventory || 0
        );

      /*
       * Only validate inventory when an
       * inventory value is actually configured.
       *
       * If inventory = 0, we don't reject it
       * because existing records may use 0
       * when inventory is not configured.
       */

      if (
        vehicleInventory > 0 &&
        requestedQuantity >
          vehicleInventory
      ) {
        throw new Error(
          `Insufficient inventory for ${vehicle.vehicleType || "selected vehicle"}. Requested ${requestedQuantity}, available ${vehicleInventory}`
        );
      }

      // ========================
      // VEHICLE SEAT CAPACITY
      // ========================

      const seatLimit =
        Number(
          vehicle.seatLimit ||
          vehicleData.seatLimit ||
          0
        );

      totalVehicleSeats +=
        seatLimit;

      // ========================
      // VEHICLE PRICE
      // ========================

      /*
       * IMPORTANT:
       *
       * No markup is applied here.
       *
       * No inflated/discount percentage
       * is applied here.
       *
       * Every vehicle's base price is added
       * to vehicleCost first.
       *
       * Package markup is applied later to:
       *
       * HOTEL + ALL VEHICLES
       */

      const baseVehiclePrice =
        Number(
          vehicleData.price ||
          vehicle.rate ||
          0
        );

      vehicleCost +=
        baseVehiclePrice;

      // ========================
      // VEHICLE BREAKDOWN
      // ========================

      vehicleBreakdown.push({
        vehicleId:
          selectedVehicleId,

        vehicleType:
          vehicleData.vehicleType ||
          vehicle.vehicleType ||
          "",

        brandName:
          vehicleData.brandName ||
          vehicle.brandName ||
          "",

        modelName:
          vehicleData.modelName ||
          vehicle.modelName ||
          "",

        price:
          baseVehiclePrice,

        seatLimit,

        inventory:
          vehicleInventory,
      });

      console.log({
        vehicleId:
          selectedVehicleId,

        vehicleType:
          vehicleData.vehicleType ||
          vehicle.vehicleType,

        baseVehiclePrice,

        seatLimit,

        inventory:
          vehicleInventory,
      });
    }

    // ========================
    // TOTAL VEHICLE CAPACITY
    // ========================

    /*
     * Make sure the selected vehicles can
     * actually accommodate all travellers.
     *
     * Example:
     *
     * 10 travellers
     *
     * Sedan = 4 seats
     * Sedan = 4 seats
     * Sedan = 4 seats
     *
     * Total = 12 seats
     *
     * Valid.
     */

    if (
      totalVehicleSeats > 0 &&
      totalVehicleSeats < travellerCount
    ) {
      throw new Error(
        `Selected vehicles can accommodate only ${totalVehicleSeats} travellers, but ${travellerCount} travellers are booking`
      );
    }

    // ========================
    // PACKAGE BASE COST
    // ========================

    /*
     * Hotel + ALL selected vehicles
     */

    const subtotal =
      hotelCost +
      vehicleCost;

    // ========================
    // PACKAGE MARKUP
    // ========================

    /*
     * Apply markup to the ENTIRE
     * holiday package cost.
     *
     * Hotel + all vehicles
     */

    const markupAmount =
      (
        subtotal *
        packageMarkup
      ) / 100;

    const subtotalAfterMarkup =
      subtotal +
      markupAmount;

    // ========================
    // PACKAGE DISCOUNT
    // ========================

    /*
     * inflatedPercentage is treated
     * as a discount.
     *
     * Therefore it is SUBTRACTED
     * from the price after markup.
     */

    const inflatedAmount =
      (
        subtotalAfterMarkup *
        packageInflation
      ) / 100;

    // ========================
    // FINAL PACKAGE PRICE
    // ========================

    const finalPackage =
      subtotalAfterMarkup -
      inflatedAmount;

    // ========================
    // DEBUG
    // ========================

    console.log(
      "PACKAGE PRICE CALCULATION:",
      {
        totalTraveller: travellerCount,

        hotelCost,

        vehicleCost,

        selectedVehicleIds,

        totalVehicleSeats,

        subtotal,

        packageMarkup,

        markupAmount,

        subtotalAfterMarkup,

        packageInflation,

        inflatedAmount,

        finalPackage,
      }
    );

    // ========================
    // RESPONSE
    // ========================

    return {
      success: true,

      finalPackage,

      breakdown: {
        days,

        totalTraveller:
          travellerCount,

        // ========================
        // BASE COSTS
        // ========================

        hotelCost,

        vehicleCost,

        // Backward compatibility
        vehicleFinal:
          vehicleCost,

        // ========================
        // VEHICLES
        // ========================

        vehicleIds:
          selectedVehicleIds,

        totalVehicles:
          selectedVehicleIds.length,

        totalVehicleSeats,

        vehicleBreakdown,

        // ========================
        // PACKAGE SUBTOTAL
        // ========================

        subtotal,

        // ========================
        // PACKAGE MARKUP
        // ========================

        markup:
          packageMarkup,

        markupAmount,

        subtotalAfterMarkup,

        // ========================
        // PACKAGE DISCOUNT
        // ========================

        inflatedPercentage:
          packageInflation,

        inflatedAmount,

        // ========================
        // FINAL PRICE
        // ========================

        finalPackage,

        // ========================
        // HOTEL BREAKDOWN
        // ========================

        hotelBreakdown,

        hotelPriceFound:
          hotelCost > 0,

        vehiclePriceFound:
          vehicleCost > 0,
      },
    };
  } catch (err) {
    console.log(err);

    return {
      success: false,
      message: err.message,
    };
  }
}

// ======================== API CONTROLLER ===========================

exports.calculatePackageCost =
  async (req, res) => {
    const result =
      await calculatePackageCostInternal(
        req.body
      );

    if (!result.success) {
      return res.status(400).json(
        result
      );
    }

    return res.json({
      success: true,

      message:
        "Package cost calculated successfully",

      ...result,
    });
  };

// ======================== EXPORT ===========================

exports.calculatePackageCostInternal =
  calculatePackageCostInternal;