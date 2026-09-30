const mongoose = require("mongoose");
const Complaint = require("../models/complaint");
const User = require("../models/User");

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

// Which user fields we show when we populate reportedBy / assignedTo
const populateFields = [
  { path: "reportedBy", select: "name email phone" },
  { path: "assignedTo", select: "name email phone" },
];

// All valid statuses (must match the Complaint model)
const ALL_STATUSES = [
  "pending",
  "verified",
  "assigned",
  "in-progress",
  "resolved",
  "rejected",
];

// Statuses a collector is allowed to set on their own complaints
const COLLECTOR_STATUSES = ["in-progress", "resolved"];

// Check that a string looks like a valid MongoDB id
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get the id as a string, whether the field is populated or not
const idToString = (field) => (field ? String(field._id || field) : null);

// One place to handle errors so every function stays short
const handleError = (res, error, action) => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  if (error.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid id or value" });
  }

  console.error(`${action} error:`, error);
  return res.status(500).json({
    success: false,
    message: `Server error while ${action}`,
  });
};

// ---------------------------------------------------------------
// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Citizen
// ---------------------------------------------------------------
exports.createComplaint = async (req, res) => {
  try {
    if (req.user.role !== "citizen") {
      return res.status(403).json({
        success: false,
        message: "Only citizens can create complaints",
      });
    }

    // Only take the fields a citizen is allowed to set.
    // status, priority, assignedTo and reportedBy are NOT read from the body.
    const { title, description, image, location, address, category } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      image,
      location,
      address,
      category,
      reportedBy: req.user._id, // always the logged-in user
    });

    await complaint.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    return handleError(res, error, "creating complaint");
  }
};

// ---------------------------------------------------------------
// @desc    Get my complaints
//          - citizen: complaints they reported
//          - collector: complaints assigned to them
// @route   GET /api/complaints/my
// @access  Citizen, Collector
// ---------------------------------------------------------------
exports.getMyComplaints = async (req, res) => {
  try {
    const filter =
      req.user.role === "collector"
        ? { assignedTo: req.user._id }
        : { reportedBy: req.user._id };

    // Optional filter: /my?status=pending
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const complaints = await Complaint.find(filter)
      .populate(populateFields)
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    return handleError(res, error, "fetching your complaints");
  }
};

// ---------------------------------------------------------------
// @desc    Get all complaints (with optional filters)
// @route   GET /api/complaints?status=pending&category=garbage&priority=high
// @access  Admin
// ---------------------------------------------------------------
exports.getAllComplaints = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all complaints",
      });
    }

    // Build the filter from the query string
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;

    const complaints = await Complaint.find(filter)
      .populate(populateFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    return handleError(res, error, "fetching complaints");
  }
};

// ---------------------------------------------------------------
// @desc    Get one complaint by id
//          - admin: any complaint
//          - citizen: only their own
//          - collector: only complaints assigned to them
// @route   GET /api/complaints/:id
// @access  Logged-in users
// ---------------------------------------------------------------
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint id" });
    }

    const complaint = await Complaint.findById(id).populate(populateFields);

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    const userId = String(req.user._id);
    const isOwner = idToString(complaint.reportedBy) === userId;
    const isAssignedCollector = idToString(complaint.assignedTo) === userId;

    const hasAccess =
      req.user.role === "admin" ||
      (req.user.role === "citizen" && isOwner) ||
      (req.user.role === "collector" && isAssignedCollector);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this complaint",
      });
    }

    return res.status(200).json({ success: true, complaint });
  } catch (error) {
    return handleError(res, error, "fetching complaint");
  }
};

// ---------------------------------------------------------------
// @desc    Update complaint status
//          - admin: any complaint, any status
//          - collector: only their assigned complaints,
//            and only "in-progress" or "resolved"
// @route   PATCH /api/complaints/:id/status
// @access  Admin, Collector
// ---------------------------------------------------------------
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint id" });
    }

    if (!status || !ALL_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ALL_STATUSES.join(", ")}`,
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role === "collector") {
      // A collector can only touch complaints assigned to them
      if (idToString(complaint.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only update complaints assigned to you",
        });
      }

      // ...and only to certain statuses
      if (!COLLECTOR_STATUSES.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Collectors can only set status to: ${COLLECTOR_STATUSES.join(", ")}`,
        });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update complaint status",
      });
    }

    // "assigned" only makes sense if a collector is actually assigned
    if (status === "assigned" && !complaint.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Assign a collector first using the assign endpoint",
      });
    }

    complaint.status = status;
    await complaint.save();
    await complaint.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Complaint status updated",
      complaint,
    });
  } catch (error) {
    return handleError(res, error, "updating complaint status");
  }
};

// ---------------------------------------------------------------
// @desc    Assign a complaint to a collector
// @route   PATCH /api/complaints/:id/assign
// @body    { "collectorId": "..." }
// @access  Admin
// ---------------------------------------------------------------
exports.assignComplaint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can assign complaints",
      });
    }

    const { id } = req.params;
    const { collectorId } = req.body;

    if (!isValidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint id" });
    }

    if (!collectorId || !isValidId(collectorId)) {
      return res.status(400).json({
        success: false,
        message: "A valid collectorId is required",
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    // Closed complaints should not be reassigned
    if (["resolved", "rejected"].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a complaint that is already ${complaint.status}`,
      });
    }

    // Make sure the user exists, is a collector, and is active
    const collector = await User.findOne({
      _id: collectorId,
      role: "collector",
      isActive: true,
    });

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Active collector not found",
      });
    }

    complaint.assignedTo = collector._id;
    complaint.status = "assigned";
    await complaint.save();
    await complaint.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      complaint,
    });
  } catch (error) {
    return handleError(res, error, "assigning complaint");
  }
};