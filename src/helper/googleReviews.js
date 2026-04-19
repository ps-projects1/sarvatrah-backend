const axios = require("axios");

const GOOGLE_API_KEY = "AIzaSyAAL9GraGc63QxJ4a5ygvYomkrflPTeSjU";
const PLACE_ID = "ChIJ2fy2wvpTGzkR7_3vvJz3nCQ";

const fetchGoogleReviews = async () => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;

    const { data } = await axios.get(url, {
      params: {
        place_id: PLACE_ID,
        fields: "name,rating,reviews",
        key: GOOGLE_API_KEY,
      },
    });

    return data?.result?.reviews || [];

  } catch (error) {
    console.error("Fetch Google Reviews Error:", error.message);
    return [];
  }
};

module.exports = fetchGoogleReviews;