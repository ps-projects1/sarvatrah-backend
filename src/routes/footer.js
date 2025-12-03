const express = require("express");
const router = express.Router();
const WebsiteFooter = require("../models/footerContact");
const { generalLimiter } = require("../middlewares/rateLimit");

// ===============================
// Get Footer Details
// ===============================
router.get("/", generalLimiter, async (req, res) => {
  try {
    let footer = await WebsiteFooter.findOne();

    // If no footer record exists, create a default one
    if (!footer) {
      footer = new WebsiteFooter({});
      await footer.save();
    }

    return res.status(200).json({
      success: true,
      data: footer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===============================
// Update Footer Details
// ===============================
router.put("/", generalLimiter, async (req, res) => {
  try {
    const {
      contactData,
      terms,
      privacyPolicy
    } = req.body;

    let footer = await WebsiteFooter.findOne();

    // Create new if not exists
    if (!footer) {
      footer = new WebsiteFooter({
        contactData,
        terms,
        privacyPolicy
      });
    } else {
      footer.contactData = contactData || footer.contactData;
      footer.terms = terms || footer.terms;
      footer.privacyPolicy = privacyPolicy || footer.privacyPolicy;
    }

    await footer.save();

    return res.status(200).json({
      success: true,
      message: "Footer updated successfully",
      data: footer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
