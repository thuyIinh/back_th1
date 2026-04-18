const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();

// GET /api/comment/user/:userId
router.get("/user/:userId", async (request, response) => {
  const { userId } = request.params;
  try {
    const photos = await Photo.find(
      { "comments.user_id": userId },
      "file_name comments",
    )
      .populate({
        path: "comments.user_id",
        select: "_id first_name last_name",
      })
      .lean();

    const comments = [];
    photos.forEach((photo) => {
      photo.comments.forEach((c) => {
        if (c.user_id._id.toString() === userId) {
          comments.push({
            _id: c._id,
            comment: c.comment,
            date_time: c.date_time,
            user: c.user_id,
            photo: {
              _id: photo._id,
              file_name: photo.file_name,
            },
          });
        }
      });
    });

    response.json(comments);
  } catch (error) {
    console.error(error);
    response
      .status(400)
      .json({ message: "Lỗi lấy bình luận", error: error.message });
  }
});

module.exports = router;
