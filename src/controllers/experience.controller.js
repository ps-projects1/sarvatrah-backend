const availabilityModel = require("../models/availability.model");
const experienceModel = require("../models/experience");
const meetingPointModel = require("../models/meetingPickup.model");
const mongoose = require("mongoose");
const pricingModel = require("../models/pricing.model");
const timeAvailabilityModel = require("../models/timing_availablity.model");
const eventCalenderModel = require("../models/experienceEvent.model");
const { path } = require("../../app");
/**
 * Creates an initial experience.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The created initial experience.
 */
const createIntialExperience = async (req, res) => {
  try {
    const title = req.query.title;
    if (!title || title.trim() === "" || title.length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }
    const intialExperience = await experienceModel.create({
      title: title,
    });
    return res.status(200).json(intialExperience);
  } catch (error) {
    console.log(error, "error in creating initial experience");
  }
};


/**
 * Updates the experience with the given ID.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {Promise} The updated experience object.
 */
const updateExperience = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const body = req.body;
  const files = req.files;
  console.log(body, "body");
  console.log(files, "files");

  const nullOrNotPresentKeys = Object.keys(body).filter(
    (key) => body[key] !== null && body[key] !== undefined
  );

  if (nullOrNotPresentKeys.length === 0 && files.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }

  console.log(nullOrNotPresentKeys, "nullOrNotPresentKeys");

  const updatedDetails = {};

  nullOrNotPresentKeys.forEach((key) => {
    if (key === "category_theme") {
      updatedDetails[key] = {
        category: Array.isArray(body[key].category) ? body[key].category : [body[key].category],
        theme: Array.isArray(body[key].theme) ? body[key].theme : [body[key].theme],
      };
    } else {
      updatedDetails[key] = body[key];
    }
  });

  if (files?.length > 0) {
    updatedDetails.img_link = files.map((file) => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
    }));
  }

  const keys = Object.keys(updatedDetails);
  console.log(keys, "keys");

  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }

  try {
    const experience = await experienceModel.findByIdAndUpdate(
      id,
      { ...updatedDetails },
      { new: true }
    );

    return res.status(200).json(experience);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};



const calenderEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Experience ID" });
    }

    const experience = await experienceModel.findById(id);
    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const eventData = req.body;  // single event object from frontend

    // Inject experienceId
    eventData.experienceId = id;

    // SAVE event
    const savedEvent = await eventCalenderModel.create(eventData);
   
    // Attach to experience
    if (!experience.calender_events) experience.calender_events = [];
    experience.calender_events.push(savedEvent._id);

   await experience.save({ validateModifiedOnly: true });


    return res.status(200).json(savedEvent);

  } catch (error) {
    console.log("ERROR in addCalendarEvent:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};





// const updateExperience = async (req, res) => {
//   console.log(req.body, "body");
//   const { id } = req.params;
//   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ error: "Invalid id" });
//   }
//   const body = req.query;

//   const nullOrNotPresentKeys = Object.keys(req.query).filter(
//     (key) => body[key] !== null || body[key] !== undefined
//   );
//   if (nullOrNotPresentKeys.length === 0) {
//     return res.status(400).json({ error: "No data to update" });
//   }
//   console.log(body, "body");
//   const updatedDetails = nullOrNotPresentKeys.map((key) => {
//     if (key === "img_link") {
//       return {
//         [key]: body[key].map((img) => {
//           return {
//             filename: img.filename,
//             path: "http://127.0.0.1:3232/" + img.path.replace("public/", ""),
//             mimetype: img.mimetype,
//           };
//         }),
//       };
//     }
//     if (key === "category_theme") {
//       console.log(body[key]);
//       return {
//         [key]: JSON.parse(body[key]),
//       };
//     }
//     return {
//       [key]: body[key],
//     };
//   });
//   const keys = Object.keys(updatedDetails[0]);
//   if (keys.length === 0) {
//     return res.status(400).json({ error: "No data to update" });
//   }
//   if (keys.includes("img_link")) {
//     updatedDetails[0].img = updateExperience.img_link.map((img) => {
//       return {
//         filename: img.filename,
//         path: "http://127.0.0.1:3232/" + file.path.replace("public/", ""),
//         mimetype: file.mimetype,
//       };
//     });
//     delete updatedDetails[0].img_link;
//   }
//   const experience = await experienceModel.findByIdAndUpdate(
//     id,
//     {
//       ...updatedDetails[0],
//     },
//     { new: true }
//   );
//   return res.status(200).json(experience);
// };

/**
 * Delete an experience by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The deleted experience.
 */
const deleteExperience = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const experience = await experienceModel.findByIdAndDelete(id);
  return res.status(200).json(experience);
};

/**
 * Retrieves an experience with the given ID from the database and returns it as a JSON response.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The parameters object containing the ID of the experience.
 * @param {string} req.params.id - The ID of the experience to retrieve.
 * @param {Object} res - The response object.
 * @return {Object} The retrieved experience as a JSON response.
 */
const getExperience = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const experience = await experienceModel
    .findById(id)
    .populate("category_theme")
    .populate("meeting_point")
    .populate("availability_detail")
    .populate("pricing")
    .populate("start_time")
    .populate("calender_events");
  return res.status(200).json(experience);
};

const getAllExperience = async (req, res) => {
  const experience = await experienceModel
    .find()
    .populate("category_theme")
    .populate("meeting_point")
    .populate("availability_detail")
    .populate("pricing")
    .populate("start_time")
    .populate("calender_events");

  return res.status(200).json(experience);
};

//meeting_point | pricing | availability_detail

/**
 * Updates the experience with availability.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} The updated experience.
 */
const updateExperienceWithAvailability = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const body = req.body;
  console.log(body, "body");
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }
  const availability_array = [];
  const insertManyAvailability = await availabilityModel.insertMany(
    body.availability_detail
  );
  for (let i = 0; i < insertManyAvailability.length; i++) {
    availability_array.push(insertManyAvailability[i]._id);
  }
  const updatedExperience = await experienceModel.findByIdAndUpdate(
    id,
    {
      availability_detail: availability_array,
    },
    { new: true }
  );
  return res.status(200).json(updatedExperience);
};

const updateExperienceWithStartTime = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const body = req.body;
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }
  const start_time_array = [];
  const insertManyStartTime = await startTimeModel.insertMany(body.start_time);
  for (let i = 0; i < insertManyStartTime.length; i++) {
    start_time_array.push(insertManyStartTime[i]._id);
  }
  const updatedExperience = await experienceModel.findByIdAndUpdate(
    id,
    {
      start_time: start_time_array,
    },
    {
      new: true,
    }
  );
  return res.status(200).json(updatedExperience);
};

/**
 * Inserts multiple meeting points into the database for a given experience.
 *
 * @param {Object} req - The request object containing parameters and body.
 * @param {Object} req.params - The parameters object containing the id.
 * @param {string} req.params.id - The id of the experience.
 * @param {Object} req.body - The body object containing the data to update.
 * @param {Array} req.body.meeting_point - The array of meeting points to insert.
 * @param {Array} req.body.removeIds - The array of meeting point ids to remove.
 * @param {Object} res - The response object to send back to the client.
 * @return {Object} The updated experience object.
 */
const insertManyMeetingPoint = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const body = req.body;
  console.log(body, "body");
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }
  const { removeIds } = body;
  if (removeIds && removeIds.length > 0) {
    await meetingPointModel.deleteMany({ _id: { $in: removeIds } });
    const updatedExperience = await experienceModel.findByIdAndUpdate(
      id,
      {
        meeting_point: [],
      },
      { new: true }
    );
    return res.status(200).json(updatedExperience);
  }
  const insertManyMeetingPoint = await meetingPointModel.insertMany(
    body.meeting_point
  );
  const updatedExperience = await experienceModel.findByIdAndUpdate(
    id,
    {
      meeting_point: insertManyMeetingPoint,
    },
    { new: true }
  );
  return res.status(200).json(updatedExperience);
};

/**
 * Updates the experience with timing.
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @return {Promise<object>} The updated experience.
 */
const updateExperienceWithTiming = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const body = req.body;
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }
  const timeAvailability = await timeAvailabilityModel.insertMany(
    body.availability_detail
  );
  const timeAvailabilityId = [];
  for (let i = 0; i < timeAvailability.length; i++) {
    timeAvailabilityId.push(timeAvailability[i]._id);
  }
  const updatedExperience = await experienceModel
    .findByIdAndUpdate(
      id,
      {
        start_time: timeAvailabilityId,
      },
      { new: true }
    )
    .populate("availability_detail")
    .populate("meeting_point");
  return res.status(200).json(updatedExperience);
};

/**
 * Inserts multiple pricing data into the database for a specific experience.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The updated experience object with the inserted pricing data.
 */
const insertManyPricing = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const body = req.body;
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return res.status(400).json({ error: "No data to update" });
  }
  const insertManyPricing = await pricingModel.insertMany(body.pricing);
  const insertManyPricingId = [];
  for (let i = 0; i < insertManyPricing.length; i++) {
    insertManyPricingId.push(insertManyPricing[i]._id);
  }
  const updatedExperience = await experienceModel.findByIdAndUpdate(
    id,
    {
      pricing: insertManyPricingId,
    },
    { new: true }
  );
  return res.status(200).json(updatedExperience);
};

const addingCalenderEvents = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const experience = await experienceModel.findById(id);
  if (!experience) {
    return res.status(400).json({ error: "Experience not found" });
  }
  const body = req.body;
  const events = body.map((event) => {
    return {
      event: event,
    };
  });
  console.log(body, "in calender controller");
  const insertManyEvents = await calenderEventModel.insertMany(events);
  const insertManyEventsId = [];
  for (let i = 0; i < insertManyEvents.length; i++) {
    insertManyEventsId.push(insertManyEvents[i]._id);
  }
  const updatedExperience = await experienceModel
    .findByIdAndUpdate(id, {
      calender_events: insertManyEventsId,
    })
    .populate("calender_events")
    .populate("availability_detail")
    .populate("pricing")
    .populate("meeting_point");
  return res.status(200).json(updatedExperience);
};

module.exports = {
  getAllExperience,
  getExperience,
  createIntialExperience,
  updateExperience,
  deleteExperience,
  insertManyMeetingPoint,
  updateExperienceWithAvailability,
  updateExperienceWithTiming,
  updateExperienceWithStartTime,
  insertManyPricing,
  calenderEvent
};
