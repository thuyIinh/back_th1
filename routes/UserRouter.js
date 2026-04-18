const express = require("express");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const router = express.Router();

// GET /api/user/list
router.get("/list", async (request, response) => {
  try {
    const users = await User.find({}, "_id first_name last_name").lean();

    // Đếm số ảnh của từng user
    const photoCounts = await Photo.aggregate([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
    ]);

    // Đếm số bình luận của từng user
    const commentCounts = await Photo.aggregate([
      { $unwind: "$comments" },
      { $group: { _id: "$comments.user_id", count: { $sum: 1 } } },
    ]);

    const photoMap = {};
    photoCounts.forEach((pc) => {
      photoMap[pc._id.toString()] = pc.count;
    });

    const commentMap = {};
    commentCounts.forEach((cc) => {
      commentMap[cc._id.toString()] = cc.count;
    });

    const result = users.map((u) => ({
      _id: u._id,
      first_name: u.first_name,
      last_name: u.last_name,
      photoCount: photoMap[u._id.toString()] || 0,
      commentCount: commentMap[u._id.toString()] || 0,
    }));

    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// GET /api/user/:id
router.get("/:id", async (request, response) => {
  const { id } = request.params;
  try {
    const user = await User.findById(
      id,
      "_id first_name last_name location description occupation",
    ).lean();

    if (!user) {
      return response
        .status(400)
        .json({ message: "Không tìm thấy người dùng" });
    }

    response.json(user);
  } catch (error) {
    // Lỗi khi id không đúng định dạng ObjectId
    response
      .status(400)
      .json({ message: "ID không hợp lệ", error: error.message });
  }
});

module.exports = router;
