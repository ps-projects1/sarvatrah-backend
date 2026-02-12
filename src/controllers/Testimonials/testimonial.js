const Testimonial = require("../../models/testimonial");
const uploadToSupabase = require("../../utils/uploadToSupabase");
const mongoose = require("mongoose");

// Create
exports.createTestimonial = async (req, res) => {
    console.log("req")
    try {
    const { name, designation, location, review, rating, isPublished } =
      req.body;
console.log("req.body",req.body)
    if (!name || !designation || !review || !rating) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    let imageUrl = "";

    // If image uploaded
    if (req.file) {
      try {
        imageUrl = await uploadToSupabase(
          req.file.path,
          req.file.originalname,
          "testimonial"
        );
      } catch (uploadErr) {
        console.error("Supabase upload failed:", uploadErr.message);

        // fallback local path
        const convertPath = (path) =>
          path.replace(/\\/g, "/").replace("public/", "");

        imageUrl = `https://your-backend-url/public/${convertPath(
          req.file.path
        )}`;
      }
    }

    const testimonial = await Testimonial.create({
      name,
      designation,
      location,
      review,
      rating,
      isPublished,
      profileImage: imageUrl,
    });

    return res.status(201).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    console.error("Create Testimonial Error:", error);
    return res.status(500).json({ error: error.message });
  }
};


// Get All (Admin)
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Published (Public API)
exports.getPublishedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid testimonial ID" });
    }

    const requestBody = req.body || {};
    const updatePayload = {};

    // Add body fields dynamically
    Object.keys(requestBody).forEach((key) => {
      if (
        requestBody[key] !== null &&
        requestBody[key] !== undefined &&
        requestBody[key] !== ""
      ) {
        updatePayload[key] = requestBody[key];
      }
    });

    // ✅ Handle Image Upload
    if (req.file) {
      let imageUrl = "";

      try {
        imageUrl = await uploadToSupabase(
          req.file.path,
          req.file.originalname,
          "testimonial"
        );
      } catch (uploadError) {
        console.error("Supabase upload failed:", uploadError.message);

        // Fallback local path
        const convertPath = (path) =>
          path.replace(/\\/g, "/").replace("public/", "");

        imageUrl = `https://sarvatrah-backend.onrender.com/public/${convertPath(
          req.file.path
        )}`;

        console.log("✅ Using local fallback image");
      }

      updatePayload.profileImage = imageUrl;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        error: "No data provided to update",
      });
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

    if (!updatedTestimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    return res.status(200).json({
      success: true,
      data: updatedTestimonial,
    });
  } catch (error) {
    console.error("Update Testimonial Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
exports.deleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
