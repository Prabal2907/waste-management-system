const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
} = require("../contollers/authcontoller");

const { protect } = require("../middlewares/authmiddlewares");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected route
router.get("/me", protect, getMe);

module.exports = router;
