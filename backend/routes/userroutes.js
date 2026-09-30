const express = require("express");
const router = express.Router();

const { getCollectors } = require("../contollers/usercontroller");
const { protect, authorizeRoles } = require("../middlewares/authmiddlewares");

// Base path: /api/users
router.get("/collectors", protect, authorizeRoles("admin"), getCollectors);

module.exports = router;
