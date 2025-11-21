const {
  generateResponse,
  generateErrorResponse,
} = require("../../helper/response");
const State = require("../../models/state");

const getState = async (req, res) => {
  try {
    const states = await State.find({}, "-__v -country");

    if (!states || states.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No states found" });
    }

    // Optionally filter out states where country is null (not matched)
    const filteredStates = states.filter((s) => s.country !== null);

    return res
      .status(200)
      .json(
        generateResponse(true, "States retrieved successfully", filteredStates)
      );
  } catch (error) {
    console.log("Get State API :", error);
    return res
      .status(500)
      .json(generateErrorResponse("Internal Server Error", error.message));
  }
};

module.exports = { getState };
