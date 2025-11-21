const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const getHotel = async (req, res) => {
  try {
    let { page = 1, limit = 10, city, state } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    if (state) {
      filter.state = { $regex: new RegExp(state, "i") };
    }

    let hotelData, total, totalPages;

    // ✅ If both city & state are given → return all results (no pagination)
    if (city && state) {
      hotelData = await hotelCollection.find(filter);
      total = hotelData.length;
      totalPages = 1;
    } else {
      // ✅ Normal pagination
      const skip = (page - 1) * limit;
      [hotelData, total] = await Promise.all([
        hotelCollection.find(filter).skip(skip).limit(limit),
        hotelCollection.countDocuments(filter),
      ]);
      totalPages = Math.ceil(total / limit);
    }

    if (!hotelData || hotelData.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No hotels found matching your criteria...",
      });
    }

    return res.status(200).json(
      generateResponse(true, "Hotel list data...", {
        hotels: hotelData,
        pagination: {
          total,
          totalPages,
          currentPage: city && state ? null : page,
          pageSize: city && state ? null : limit,
          hasNextPage: city && state ? false : page < totalPages,
          hasPrevPage: city && state ? false : page > 1,
        },
        filters: {
          city: city || null,
          state: state || null,
        },
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
