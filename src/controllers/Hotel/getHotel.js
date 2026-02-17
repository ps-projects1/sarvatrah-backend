const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const getHotel = async (req, res) => {
  try {
    let { page, limit, city, state } = req.query;

    const filter = {};

    // Trim whitespace and apply case-insensitive regex filter
    if (city) {
      const cityTrimmed = city.trim();
      filter.city = { $regex: new RegExp(`^${cityTrimmed}$`, "i") };
      console.log(`🔍 Filtering hotels by city: "${cityTrimmed}"`);
    }
    if (state) {
      const stateTrimmed = state.trim();
      filter.state = { $regex: new RegExp(`^${stateTrimmed}$`, "i") };
      console.log(`🔍 Filtering hotels by state: "${stateTrimmed}"`);
    }

    let hotelData, total, totalPages;

    const isPaginationRequested = page !== undefined && limit !== undefined;

    if (isPaginationRequested) {
      page = parseInt(page);
      limit = parseInt(limit);
    }

    // Case 1: city & state together → return all (SORT REQUIRED)
    if (city && state) {
      hotelData = await hotelCollection.find(filter).sort({ _id: -1 });
      total = hotelData.length;
      totalPages = 1;
      console.log(`✅ Found ${total} hotels matching city: "${city}" and state: "${state}"`);
    }
    // Case 2: no pagination → return all (SORT REQUIRED)
    else if (!isPaginationRequested) {
      hotelData = await hotelCollection.find(filter).sort({ _id: -1 });
      total = hotelData.length;
      totalPages = 1;
    }
    // Case 3: Pagination applied
    else {
      const skip = (page - 1) * limit;

      [hotelData, total] = await Promise.all([
        hotelCollection
          .find(filter)
          .sort({ _id: -1 })         // Latest first
          .skip(skip)
          .limit(limit),

        hotelCollection.countDocuments(filter)
      ]);

      totalPages = Math.ceil(total / limit);
    }

    if (!hotelData || hotelData.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No hotels found matching your criteria..."
      });
    }

    return res.status(200).json(
      generateResponse(true, "Hotel list data...", {
        hotels: hotelData,
        pagination: {
          total,
          totalPages,
          currentPage: isPaginationRequested ? page : null,
          pageSize: isPaginationRequested ? limit : null,
          hasNextPage: isPaginationRequested ? page < totalPages : false,
          hasPrevPage: isPaginationRequested ? page > 1 : false
        },
        filters: {
          city: city || null,
          state: state || null
        }
      })
    );

  } catch (error) {
    console.log("Get hotel API :", error);
    return res
      .status(500)
      .json(generateErrorResponse("Some internal server error", error.message));
  }
};

module.exports = {
  getHotel,
};
