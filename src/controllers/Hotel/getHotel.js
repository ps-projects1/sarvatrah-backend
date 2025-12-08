const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const getHotel = async (req, res) => {
  try {
    let { page, limit, city, state } = req.query;

    const filter = {};

    if (city) filter.city = { $regex: new RegExp(city, "i") };
    if (state) filter.state = { $regex: new RegExp(state, "i") };

    let hotelData, total, totalPages;

    const isPaginationRequested = page !== undefined && limit !== undefined;

    // Convert to number if provided
    if (isPaginationRequested) {
      page = parseInt(page);
      limit = parseInt(limit);
    }

    // Case 1: both city & state → return all (your existing rule)
    if (city && state) {
      hotelData = await hotelCollection.find(filter);
      total = hotelData.length;
      totalPages = 1;
    }
    // Case 2: page & limit NOT PROVIDED → return all
    else if (!isPaginationRequested) {
      hotelData = await hotelCollection.find(filter);
      total = hotelData.length;
      totalPages = 1;
    }
    // Case 3: Pagination applied
    else {
      const skip = (page - 1) * limit;

      [hotelData, total] = await Promise.all([
        hotelCollection
          .find(filter)
          .sort({ _id: -1 })  // <-- Correct!
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
