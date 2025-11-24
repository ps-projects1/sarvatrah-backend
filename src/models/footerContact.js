const mongoose = require("mongoose");

const websiteFooterSchema = new mongoose.Schema({
  contactData: {
    mobile: { type: String, required: true },
    altMobile: { type: String, default: "" },
    address: { type: String, default: "" },
    email: { type: String, required: true },
    altEmail: { type: String, default: "" },
    instaLink: { type: String, default: "" },
    whatsappLink: { type: String, default: "" },
    youtubeLink: { type: String, default: "" },
    twitterLink: { type: String, default: "" },
    facebookLink: { type: String, default: "" }
  },

  terms: { type: String, default: "" },
  privacyPolicy: { type: String, default: "" }

}, { timestamps: true });

module.exports = mongoose.model("WebsiteFooter", websiteFooterSchema);
