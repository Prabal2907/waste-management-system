const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
} = require("../contollers/authcontoller");
const { protect } = require("../middlewares/authmiddlewares");

// Base path: /api/auth
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
