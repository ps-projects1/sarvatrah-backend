// middlewares/rateLimit.js
const rateLimit = require("express-rate-limit");

/**
 *  General limiter for normal API routes
 * Example: /api/v1, /booking, etc.
 */
exports.generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 25,                 // Max 25 requests per IP per window
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
});

/**
 *  Upload limiter for heavy file upload routes
 * Example: /hotel/upload, /vehicle/upload
 */
exports.uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,                 // Max 10 requests per IP per window
  message: {
    success: false,
    error: "Too many upload attempts. Try again after 1 minute."
  }
});

/**
 * 3️⃣ Login limiter – stricter to prevent brute force attacks
 * Example: /api/v1/login
 */
exports.loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,                  // Max 5 login attempts per IP per window
  message: {
    success: false,
    error: "Too many login attempts. Please try again after 5 minutes."
  }
});

/**
 *  Conditional limiter wrapper
 * Apply a limiter ONLY if the request contains files
 */
exports.limitIfFiles = (limiter) => {
  return (req, res, next) => {
    if (req.file || (req.files && Object.keys(req.files).length > 0)) {
      return limiter(req, res, next); // Forward manually
    }
    next(); // No files → skip limiter
  };
};
