const GoogleReview = require("../models/googleReview");
const fetchGoogleReviews = require("./googleReviews");

const syncGoogleReviews = async () => {
  try {
    const reviews = await fetchGoogleReviews();

    for (const review of reviews) {
      const uniqueId = `${review.author_name}_${review.time}`;

      const exists = await GoogleReview.findOne({
        googleReviewId: uniqueId,
      });

      if (exists) continue;

      await GoogleReview.create({
        authorName: review.author_name,
        rating: review.rating,
        reviewText: review.text,
        profilePhoto: review.profile_photo_url,
        reviewTime: new Date(review.time * 1000),
        googleReviewId: uniqueId,
        isPublished: true,
      });
    }

    console.log("Google Reviews synced successfully");

  } catch (error) {
    console.error("Sync Error:", error.message);
  }
};

module.exports = syncGoogleReviews;