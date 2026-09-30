const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    // URL or path of the uploaded photo (e.g. from Cloudinary or multer)
    image: {
      type: String,
      default: "",
    },

    // Where the waste problem is (GPS coordinates)
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: -180,
        max: 180,
      },
    },

    // Human-readable address, e.g. "12 Mall Road, Kanpur"
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "garbage",
        "illegal_dumping",
        "overflowing_bin",
        "dead_animal",
        "other",
      ],
      default: "other",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "assigned",
        "in-progress",
        "resolved",
        "rejected",
      ],
      default: "pending",
    },

    // The citizen who reported the problem (always required)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },

    // The collector handling it (optional, set later by an admin)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  },
);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;