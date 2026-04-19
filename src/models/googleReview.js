const mongoose = require("mongoose");

const googleReviewSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
    },

    reviewText: {
      type: String,
    },

    profilePhoto: {
      type: String,
    },

    reviewTime: {
      type: Date,
    },

    googleReviewId: {
      type: String, // unique identifier
      unique: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoogleReview", googleReviewSchema);