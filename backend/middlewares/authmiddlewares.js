const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---------------------------------------------------------------
// protect
// Checks that the request comes from a logged-in user.
//
// Steps:
//   1. Read the JWT from the HTTP-only cookie
//   2. Verify the token
//   3. Find the user in MongoDB (without the password)
//   4. Attach the user to req.user
//
// Use it on any route that needs a logged-in user.
// ---------------------------------------------------------------
exports.protect = async (req, res, next) => {
  try {
    // 1. Get the token from the cookie (needs cookie-parser in app.js)
    const token = req.cookies && req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // 2. Verify the token (throws an error if invalid or expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user. "-password" makes sure the password is never included.
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Block deactivated accounts even if their token is still valid
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // 4. Attach the user to the request for the next middleware/controller
    req.user = user;
    next();
  } catch (error) {
    // Token problems -> 401
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Anything else is an unexpected server error
    console.error("Protect middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// ---------------------------------------------------------------
// authorizeRoles(...roles)
// Allows only users whose role is in the list.
// Must be used AFTER protect, because it needs req.user.
//
// Example: router.get("/users", protect, authorizeRoles("admin"), getUsers);
// ---------------------------------------------------------------
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Safety check in case protect was forgotten on the route
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${req.user.role}" is not allowed to perform this action.`,
      });
    }

    next();
  };
};