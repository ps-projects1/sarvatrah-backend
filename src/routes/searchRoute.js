const express = require("express");
const router = express.Router();

const {
  globalSearch,
  searchTours,
  searchPackage,        // ⭐ ADDED
} = require("../controllers/Search/searchController");

// --------------------------------------
// GLOBAL SEARCH
// --------------------------------------
router.get("/", globalSearch);

// --------------------------------------
// TOUR SPECIFIC ADVANCED SEARCH
// --------------------------------------
router.get("/tours", searchTours);
// Example: /api/search/tours?q=himachal&minPrice=10000&theme=family

// --------------------------------------
// ⭐ NEW — HOLIDAY PACKAGE SEARCH WITH FULL DETAILS
// --------------------------------------
router.post("/package", searchPackage);


module.exports = router;
