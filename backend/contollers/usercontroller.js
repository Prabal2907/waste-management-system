const User = require("../models/User");

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
