const GoogleReview = require("../models/googleReview");

const getGoogleReviews = async (req, res) => {
  try {
    const reviews = await GoogleReview.find({
      isPublished: true,
    })
      .sort({ reviewTime: -1 })
      .limit(10);

    res.json({
      success: true,
      data: reviews,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

module.exports = { getGoogleReviews };