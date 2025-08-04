const User = require("../../models/user");

const logout = async (req, res) => {
  try {
    // Remove the current token from the user's tokens array
    req.user.tokens = req.user.tokens.filter((tokenObj) => {
      return tokenObj.token !== req.token;
    });

    await req.user.save();

    // Clear the cookie
    res.clearCookie("auth_token", {
      path: "/",
    });

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { logout };
