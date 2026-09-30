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
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Create a signed JWT containing only the user's id and role
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role?.toLowerCase() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// Build a safe user object (never includes the password)
const sanitizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role?.toLowerCase() || "citizen",
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
// @desc    Register a new user (citizen / collector / admin)
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, location } = req.body;

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

    // Validate and normalize role (default to "citizen" if not supplied)
    const validRoles = ["citizen", "collector", "admin"];
    const normalizedRole =
      role && validRoles.includes(role.toLowerCase())
        ? role.toLowerCase()
        : "citizen";

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

    // Create the user with the requested role
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      address,
      location,
      role: normalizedRole,
      isActive: true,
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
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: getValidationMessage(error),
      });
    }

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

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

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
// @access  Private
// ---------------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
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

// ---------------------------------------------------------------
// @desc    Get all collectors (admin only)
// @route   GET /api/users/collectors
// @access  Private (Admin)
// ---------------------------------------------------------------
exports.getCollectors = async (req, res) => {
  try {
    const collectors = await User.find({
      role: "collector",
      isActive: true,
    }).select("name email phone");

    return res.status(200).json({
      success: true,
      count: collectors.length,
      collectors,
    });
  } catch (error) {
    console.error("getCollectors error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching collectors",
    });
  }
};