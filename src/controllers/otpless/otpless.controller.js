const jwt = require("jsonwebtoken");
const { createRemoteJWKSet, jwtVerify } = require("jose");
const User = require("../../models/user");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const OTPLESS_APP_ID = process.env.OTPLESS_APP_ID;

const OTPLESS_ISSUER = "https://otpless.com";
const OTPLESS_JWKS_URL = "https://otpless.com/.well-known/jwks";

const jwks = createRemoteJWKSet(new URL(OTPLESS_JWKS_URL));

/**
 * Verify OTPLESS ID Token
 */
const verifyOtplessToken = async (idToken) => {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: OTPLESS_ISSUER,
    audience: OTPLESS_APP_ID,
    algorithms: ["RS256"],
    clockTolerance: 60,
  });

  if (!payload.phone_number_verified) {
    throw new Error("Phone number not verified");
  }

  return payload;
};

/**
 * OTPLESS LOGIN (Register if first time)
 */
const otplessLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required",
      });
    }

    // 1️⃣ Verify OTPLESS token
    const claims = await verifyOtplessToken(idToken);

    const phone = claims.phone_number; // "919999999999"
    const email = claims.email || null;
    const otplessSub = claims.sub;

    // 2️⃣ Find user
    let user = await User.findOne({
      $or: [
        { otplessSub },
        { mobilenumber: phone },
        ...(email ? [{ email }] : []),
      ],
    });

    let isNewUser = false;

    // 3️⃣ Register if not found
    if (!user) {
      isNewUser = true;

      user = await User.create({
        firstname: claims.name || "",
        lastname: "",
        email,
        mobilenumber: phone,
        otplessSub,
        authProvider: "otpless",
        password: null,          // IMPORTANT
        isVerified: true,
        verifiedAt: new Date(),
      });
    }

    // 4️⃣ Create YOUR JWT (LOGIN)
    const appToken = jwt.sign(
      {
        userId: user._id,
        role: user.userRole,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Response
    return res.status(200).json({
      success: true,
      isNewUser,
      token: appToken,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        mobilenumber: user.mobilenumber,
        userRole: user.userRole,
      },
    });
  } catch (error) {
    console.error("OTPLESS LOGIN ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: error.message || "OTPLESS authentication failed",
    });
  }
};

module.exports = {
  otplessLogin,
};
