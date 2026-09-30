const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
} = require("../contollers/complaintcontroller");
const { protect, authorizeRoles } = require("../middlewares/authmiddlewares");

// Base path: /api/complaints

// Citizen creates a complaint
router.post("/", protect, authorizeRoles("citizen"), createComplaint);

// Citizen: own complaints | Collector: assigned complaints
// (keep this ABOVE "/:id", otherwise "my" is treated as an id)
router.get(
  "/my",
  protect,
  authorizeRoles("citizen", "collector"),
  getMyComplaints,
);

// Admin: all complaints (supports ?status=&category=&priority=)
router.get("/", protect, authorizeRoles("admin"), getAllComplaints);

// Single complaint (access rules are checked inside the controller)
router.get("/:id", protect, getComplaintById);

// Admin or assigned collector updates status
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "collector"),
  updateComplaintStatus,
);

// Admin assigns a collector
router.patch("/:id/assign", protect, authorizeRoles("admin"), assignComplaint);

module.exports = router;