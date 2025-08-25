const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const { hotelCollection } = require("../../models/hotel");

const getHotel = async (req, res) => {
  try {
    // read query params (default page=1, limit=10)
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // calculate skip
    const skip = (page - 1) * limit;

    // fetch data
    const [hotelData, total] = await Promise.all([
      hotelCollection.find({}).skip(skip).limit(limit),
      hotelCollection.countDocuments({}),
    ]);

    if (!hotelData || hotelData.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found...",
      });
    }

    // meta info
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json(
      generateResponse(true, "Hotel list data...", {
        hotels: hotelData,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
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
