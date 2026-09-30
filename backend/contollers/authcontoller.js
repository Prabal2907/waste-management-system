const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

const isProduction = process.env.NODE_ENV === "production";

// Cookie settings (used for both setting and clearing the cookie)
const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read this cookie
  secure: isProduction, // only sent over HTTPS in production
  // "none" is needed if your frontend and backend are on different domains
  // in production. Use "strict" or "lax" if they share the same site.
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Create a signed JWT containing only the user's id and role
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Build a safe user object (never includes the password)
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  address: user.address,
  location: user.location,
  profileImage: user.profileImage,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Format Mongoose validation errors into a readable message
const getValidationMessage = (error) =>
  Object.values(error.errors)
    .map((err) => err.message)
    .join(", ");

// ---------------------------------------------------------------
// @desc    Register a new citizen
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------
exports.register = async (req, res) => {
  try {
    // Only pick the fields we allow. "role" and "isActive" are
    // intentionally NOT read from req.body.
    const { name, email, password, phone, address, location } = req.body;

    // Basic checks
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and phone are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user. Role is ALWAYS "citizen" here.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      location,
      role: "citizen",
    });

    // Log the user in right away
    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    // Mongoose validation errors (e.g. name too short)
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: getValidationMessage(error),
      });
    }

    // Duplicate key error (two requests registering the same email at once)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering",
    });
  }
};

// ---------------------------------------------------------------
// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // password has `select: false` in the model, so we must ask for it
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    // Same message for "no user" and "wrong password" so attackers
    // can't tell which emails are registered
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

// ---------------------------------------------------------------
// @desc    Logout the current user
// @route   POST /api/auth/logout
// @access  Public
// ---------------------------------------------------------------
exports.logout = (req, res) => {
  // Options must match the ones used when setting the cookie
  // (except maxAge) or the browser may not remove it
  res.clearCookie("token", {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ---------------------------------------------------------------
// @desc    Get the currently logged-in user
// @route   GET /api/auth/me
// @access  Private (needs auth middleware that sets req.user)
// ---------------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware after verifying the JWT
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// GET /api/users/collectors  (admin only)
exports.getCollectors = async (req, res) => {
  try {
    const collectors = await User.find({
      role: "collector",
      isActive: true,
    }).select("name email phone");
    return res
      .status(200)
      .json({ success: true, count: collectors.length, collectors });
  } catch (error) {
    console.error("getCollectors error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching collectors",
      });
  }
};