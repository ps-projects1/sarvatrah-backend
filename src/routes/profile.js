const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../utils/file_upload/upload");
const { generalLimiter, uploadLimiter, limitIfFiles } = require("../middlewares/rateLimit");

const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
} = require("../controllers/User/user.controller");

// ===================== USER PROFILE ROUTES =====================

// Get user profile (authenticated users only)
router.get(
  "/",
  authMiddleware,
  generalLimiter,
  getUserProfile
);

// Update user profile (authenticated users only)
router.put(
  "/",
  authMiddleware,
  generalLimiter,
  updateUserProfile
);

// Upload profile picture (authenticated users only)
router.post(
  "/picture",
  authMiddleware,
  upload.single("profilePicture"),
  limitIfFiles(uploadLimiter),
  uploadProfilePicture
);

module.exports = router;
