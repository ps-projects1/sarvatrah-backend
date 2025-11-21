// -----------------------------------------------------
// Correct Imports
// -----------------------------------------------------
const { hotelCollection } = require("../../models/hotel");
const { HolidayPackage } = require("../../models/holidaysPackage");
const { vehicleCollection } = require("../../models/vehicle");
const Activities = require("../../models/activities");
const Experience = require("../../models/experience");
const Pilgrimage = require("../../models/pilgriPackage");

// Allowed types
const ALLOWED_TYPES = [
  "hotel",
  "tour",
  "activity",
  "car",
  "experience",
  "pilgrimage",
  "all",
];

// Sorting options (alphabetic / newest)
const SORT_MAP = {
  name_asc: { packageName: 1, hotelName: 1, activityName: 1 },
  name_desc: { packageName: -1, hotelName: -1, activityName: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

exports.globalSearch = async (req, res) => {
  try {
    const {
      query,
      type = "all",
      page = 1,
      limit = 20,
      sort = "name_asc",
    } = req.query;

    // --------------- VALIDATION ---------------
    if (!query?.trim())
      return res.status(400).json({ success: false, message: "Query required" });

    if (!ALLOWED_TYPES.includes(type))
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      });

    const skip = (Number(page) - 1) * Number(limit);

    const regex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    // --------------- SMART CITY/STATE MATCH ---------------
    const locationFilters = {
      hotel: [{ city: regex }, { state: regex }],
      tour: [{ destinationCity: regex }, { startCity: regex }],
      activity: [{ activityPlace: regex }, { targetPlaces: regex }],
      experience: [{ "location.city": regex }, { "location.state": regex }],
      car: [{ city: regex }],
      pilgrimage: [{ "itinerary.place": regex }],
    };

    // --------------- MAIN QUERY ENGINE ---------------
    const QUERY_MAP = {
      hotel: {
        model: hotelCollection,
        filter: {
          $or: [
            { hotelName: regex },
            { hotelType: regex },
            { city: regex },
            { state: regex },
            ...locationFilters.hotel,
          ],
        },
      },

      tour: {
        model: HolidayPackage,
        filter: {
          $or: [
            { packageName: regex },
            { destinationCity: regex },
            { startCity: regex },
            { packageType: regex },
            ...locationFilters.tour,
          ],
        },
      },

      activity: {
        model: Activities,
        filter: {
          $or: [
            { activityName: regex },
            { activityPlace: regex },
            { packageType: regex },
            { description: regex },
            ...locationFilters.activity,
          ],
        },
      },

      experience: {
        model: Experience,
        filter: {
          $or: [
            { title: regex },
            { "location.city": regex },
            { "location.state": regex },
            { "category_theme.category": regex },
            ...locationFilters.experience,
          ],
        },
      },

      car: {
        model: vehicleCollection,
        filter: {
          $or: [
            { city: regex },
            { vehicleType: regex },
            { brandName: regex },
            { modelName: regex },
            ...locationFilters.car,
          ],
        },
      },

      pilgrimage: {
        model: Pilgrimage,
        filter: {
          $or: [
            { packageName: regex },
            { include: regex },
            { exclude: regex },
            ...locationFilters.pilgrimage,
          ],
        },
      },
    };

    // --------------- SORTING LOGIC ---------------
    const selectedSort = SORT_MAP[sort] || SORT_MAP.name_asc;

    const runSearch = async (key) => {
      const cfg = QUERY_MAP[key];
      return cfg.model
        .find(cfg.filter)
        .sort(selectedSort)
        .skip(skip)
        .limit(Number(limit));
    };

    // --------------- EXECUTE SEARCH ---------------
    let results = {};

    if (type === "all") {
      const [
        hotels,
        tours,
        activities,
        experiences,
        cars,
        pilgrimage,
      ] = await Promise.all([
        runSearch("hotel"),
        runSearch("tour"),
        runSearch("activity"),
        runSearch("experience"),
        runSearch("car"),
        runSearch("pilgrimage"),
      ]);

      results = { hotels, tours, activities, experiences, cars, pilgrimage };
    } else {
      results[type] = await runSearch(type);
    }

    // Remove empty
    Object.keys(results).forEach(
      (key) => !results[key]?.length && delete results[key]
    );

    return res.status(200).json({
      success: true,
      query,
      type,
      page: Number(page),
      limit: Number(limit),
      sort,
      results,
    });
  } catch (err) {
    console.error("❌ Global Search Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// -----------------------------------------------------
// TOUR SEARCH CONTROLLER 
// -----------------------------------------------------


const escapeRegex = (text) =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

exports.searchTours = async (req, res) => {
  try {
    const {
      q = "",
      minPrice = 0,
      maxPrice = 99999999,
      sort = "low_to_high",
      duration = "",
      theme = "",
      hotDeals = "",
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};

    // ----------------------------- SEARCH -----------------------------
    if (q.trim()) {
      const regex = escapeRegex(q.trim());
      filter.$or = [
        { packageName: regex },
        { destinationCity: regex },
        { startCity: regex },
      ];
    }

    // ----------------------------- PRICE FILTER -----------------------------
    filter.finalPrice = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    };

    // ----------------------------- DURATION FILTER -----------------------------
    if (duration === "lt6") {
      filter["packageDuration.nights"] = { $lt: 6 };
    } else if (duration === "7to9") {
      filter["packageDuration.nights"] = { $gte: 7, $lte: 9 };
    } else if (duration === "gt10") {
      filter["packageDuration.nights"] = { $gt: 10 };
    }

    // ----------------------------- THEME FILTER -----------------------------
    if (theme) {
      filter.packageType = theme;
    }

    // ----------------------------- HOT DEALS -----------------------------
    if (hotDeals === "true") {
      filter.isHotDeal = true;
    }

    // ----------------------------- SORTING -----------------------------
    let sortConfig = {};
    if (sort === "low_to_high") sortConfig = { finalPrice: 1 };
    else if (sort === "high_to_low") sortConfig = { finalPrice: -1 };
    else if (sort === "newest") sortConfig = { createdAt: -1 };
    else if (sort === "oldest") sortConfig = { createdAt: 1 };

    // ----------------------------- DATABASE QUERY -----------------------------
    const [results, total] = await Promise.all([
      HolidayPackage.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(Number(limit)),
      HolidayPackage.countDocuments(filter),
    ]);

    // ========================================================================
    // 🔥 UI ENRICHMENT (Perfect for Frontend Display Like MMT / Yatra / EaseMyTrip)
    // ========================================================================
    const transformed = results.map((pkg) => {
      const doc = pkg._doc;

      const finalPrice = Number(doc.finalPrice || 0);
      const basePrice = Number(doc.basePrice || 0);
      const discountType = doc.discountType || "none";
      const discountValue = Number(doc.discountValue || 0);

      // --------------------------------------------------------------------
      // 💰 PRICE LOGIC
      // --------------------------------------------------------------------

      let actualPrice;

      if (discountType === "none" || !discountType) {
        // Generate fake MRP 10%–25% higher (looks realistic)
        const markup = Math.floor(Math.random() * 16) + 10; // 10–25%
        actualPrice = Math.round(finalPrice + (finalPrice * markup) / 100);
      } else if (discountType === "percent" && discountValue > 0) {
        actualPrice = Math.round(finalPrice / (1 - discountValue / 100));
      } else if (discountType === "fixed" && discountValue > 0) {
        actualPrice = finalPrice + discountValue;
      } else {
        actualPrice = basePrice || finalPrice;
      }

      const discountedPrice = finalPrice;

      const discountPercentage =
        actualPrice > 0
          ? Math.round(((actualPrice - discountedPrice) / actualPrice) * 100)
          : 0;

      // --------------------------------------------------------------------
      // 🏨 HOTEL, 🎡 ACTIVITY & 🚕 TRANSFER COUNTS
      // --------------------------------------------------------------------
      const itinerary = Array.isArray(doc.itinerary) ? doc.itinerary : [];

      const hotelCount = itinerary.filter(
        (d) => d.stay === true || d.hotel_id
      ).length;

      const activityCount = itinerary.reduce(
        (acc, d) => acc + (Array.isArray(d.activities) ? d.activities.length : 0),
        0
      );

      const transferCount = itinerary.filter(
        (d) => d.transport && d.transport.type
      ).length;

      const durationLabel =
        doc.packageDuration &&
        `${doc.packageDuration.days}D - ${doc.packageDuration.nights}N`;

      // --------------------------------------------------------------------
      // FINAL RETURN STRUCTURE
      // --------------------------------------------------------------------
      return {
        ...doc,
        ui: {
          actualPrice,
          discountedPrice,
          discountPercentage,
          hotelCount,
          activityCount,
          transferCount,
          durationLabel,
        },
      };
    });

    // ========================================================================
    // 🔚 FINAL RESPONSE
    // ========================================================================
    return res.status(200).json({
      success: true,
      filtersApplied: {
        q,
        minPrice,
        maxPrice,
        duration,
        theme,
        hotDeals,
        sort,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: transformed,
    });
  } catch (err) {
    console.error("❌ Tour Search Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while searching tours",
    });
  }
};


// controllers/searchPackageController.js



/* -------------------------------------------------------------
   HELPER: GET FIRST VALID DEPARTURE AFTER TRAVEL DATE
------------------------------------------------------------- */
function getSelectedDeparture(pkg, travelDate) {
  if (!pkg.departures || pkg.departures.length === 0) return null;

  const tDate = new Date(travelDate);

  const future = pkg.departures
    .filter((d) => new Date(d.startDate) >= tDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return future[0] || pkg.departures[0];
}

/* -------------------------------------------------------------
   HELPER: HOTEL PRICE PER DAY BASED ON MODEL
------------------------------------------------------------- */
async function calculateHotelCostForDay(hotelId, adults, children) {
  const hotel = await hotelCollection.findById(hotelId).lean();
  if (!hotel || !hotel.rooms || hotel.rooms.length === 0) return 0;

  // Default to first room (as per your structure)
  const room = hotel.rooms[0];

  const adultPrice = room.adultPrice || 0;
  const extraAdultPrice = room.extraAdultPrice || 0;
  const extraChildPrice = room.extraChildPrice || 0;

  let total = 0;

  // Base = 2 adults included (example logic)
  if (adults > 2) {
    total += 2 * adultPrice;
    total += (adults - 2) * extraAdultPrice;
  } else {
    total += adults * adultPrice;
  }

  total += children * extraChildPrice;

  return total;
}

/* -------------------------------------------------------------
   HELPER: MAIN CALCULATION — HOTEL × DAYS + VEHICLE × MARKUP%
------------------------------------------------------------- */
async function calculatePackagePrice(pkg, departure, adults, children) {
  const days = pkg.packageDuration?.days || 1;

  let hotelCostPerDay = 0;

  // Iterate day-wise itinerary to sum hotel cost of each stay
  for (let day of pkg.itinerary) {
    if (!day.hotel_id) continue;

    const cost = await calculateHotelCostForDay(day.hotel_id, adults, children);
    hotelCostPerDay += cost;
  }

  const totalHotelCost = hotelCostPerDay * days;

  // BASE VEHICLE COST → first package-level vehicle
  const baseVehicle =
    pkg.availableVehicle?.length > 0 ? pkg.availableVehicle[0] : null;

  const baseVehicleCost = baseVehicle?.price || 0;

  const markup = pkg.priceMarkup || 0;
  const vehicleCostWithMarkup = baseVehicleCost + (baseVehicleCost * markup) / 100;

  const finalCost = totalHotelCost + vehicleCostWithMarkup;

  return {
    hotelCostPerDay,
    totalHotelCost,
    baseVehicleCost,
    markupPercentage: markup,
    vehicleCostWithMarkup,
    finalCost,
  };
}

/* -------------------------------------------------------------
   FORMAT VEHICLE FOR RESPONSE (with images)
------------------------------------------------------------- */
function mapVehicle(v) {
  if (!v) return null;
  return {
    vehicle_id: v.vehicle_id,
    vehicleType: v.vehicleType,
    brandName: v.brandName,
    modelName: v.modelName,
    seats: v.seats,
    baggageCapacity: v.baggageCapacity,
    facilities: v.facilities,
    price: v.price,
    description: v.description,
    images: v.images || [],
  };
}

/* -------------------------------------------------------------
   FORMAT HOTEL FOR RESPONSE (with images)
------------------------------------------------------------- */
function mapHotelOption(h) {
  if (!h) return null;
  return {
    hotel_id: h.hotel_id,
    hotelName: h.hotelName,
    roomType: h.roomType,
    rating: h.rating,
    price: h.price,
    facilities: h.facilities,
    roomDescription: h.roomDescription,
    images: h.images || [],
    hotelImages: h.hotelImages || [],
    roomImages: h.roomImages || [],
  };
}

/* -------------------------------------------------------------
   MAIN CONTROLLER
------------------------------------------------------------- */
exports.searchPackage = async (req, res) => {
  try {
    const { packageId, packageName, travelDate, adults = 2, children = 0 } =
      req.body;

    let pkg = null;

    if (packageId) {
      pkg = await HolidayPackage.findById(packageId).lean();
    } else if (packageName) {
      pkg = await HolidayPackage.findOne({
        packageName: { $regex: new RegExp(packageName, "i") },
      }).lean();
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    // Find departure date
    const departureUsed = getSelectedDeparture(pkg, travelDate);

    // Price calculation
    const priceDetails = await calculatePackagePrice(
      pkg,
      departureUsed,
      Number(adults),
      Number(children)
    );

    /* -------------------------------------------------------------
       BUILD ITINERARY RESPONSE FORMAT
    ------------------------------------------------------------- */
    const fullItinerary = [];

    for (let day of pkg.itinerary) {
      const formattedDay = {
        dayNo: day.dayNo,
        title: day.title,
        subtitle: day.subtitle,
        description: day.description,
        state: day.state,
        city: day.city,
        stay: day.stay,
        mealsIncluded: day.mealsIncluded,
        placesToVisit: day.placesToVisit,
        notes: day.notes,
        exactDate: day.exactDate,

        defaultVehicle: mapVehicle(day.defaultVehicleForDay),
        upgradeVehicles: (day.upgradedVehicleOptions || []).map(mapVehicle),

        defaultHotel: mapHotelOption(day.defaultHotelDetails),
        upgradeHotels: (day.hotelOptions || []).map(mapHotelOption),

        activities: (day.activities || []).map((a) => ({
          type: a.type,
          title: a.title,
          description: a.description,
          duration: a.duration,
          price: a.price,
          image: a.image,
        })),
      };

      fullItinerary.push(formattedDay);
    }

    /* -------------------------------------------------------------
       FINAL RESPONSE FORMAT (MATCHES YOUR EXAMPLE EXACTLY)
    ------------------------------------------------------------- */
    return res.json({
      success: true,

      package: {
        packageId: pkg._id,
        packageName: pkg.packageName,
        uniqueId: pkg.uniqueId,
        duration: pkg.packageDuration,
        destinationCity: pkg.destinationCity,
        startCity: pkg.startCity,
        highlights: pkg.highlights,
        themeImg: pkg.themeImg,
        images: pkg.images || [],
        galleryImages: pkg.galleryImages || [],
      },

      departureUsed,

      travelDate: departureUsed?.startDate,

      priceDetails,

      packageLevelVehicles: (pkg.availableVehicle || []).map(mapVehicle),

      itinerary: fullItinerary,
    });
  } catch (err) {
    console.error("SEARCH PACKAGE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
