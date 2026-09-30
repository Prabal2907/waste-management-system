const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---------------------------------------------------------------
// Environment
// ---------------------------------------------------------------

const isProduction = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------
// Cookie settings
// ---------------------------------------------------------------
// Localhost:
//   secure: false
//   sameSite: "lax"
//
// Production (Vercel frontend + Render backend):
//   secure: true
//   sameSite: "none"
//
// SameSite=None is required because the frontend and backend
// are on different domains.
// ---------------------------------------------------------------

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ---------------------------------------------------------------
// Generate JWT
// ---------------------------------------------------------------

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role?.toLowerCase(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// ---------------------------------------------------------------
// Sanitize user
// ---------------------------------------------------------------

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

// ---------------------------------------------------------------
// Validation error helper
// ---------------------------------------------------------------

const getValidationMessage = (error) =>
  Object.values(error.errors)
    .map((err) => err.message)
    .join(", ");

// ---------------------------------------------------------------
// REGISTER
// POST /api/auth/register
// Public
// ---------------------------------------------------------------

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, location } = req.body;

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

    const validRoles = ["citizen", "collector", "admin"];

    const normalizedRole =
      role && validRoles.includes(role.toLowerCase())
        ? role.toLowerCase()
        : "citizen";

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
// LOGIN
// POST /api/auth/login
// Public
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
// LOGOUT
// POST /api/auth/logout
// Public
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
// GET CURRENT USER
// GET /api/auth/me
// Private
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
// GET COLLECTORS
// GET /api/users/collectors
// Private - Admin
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
