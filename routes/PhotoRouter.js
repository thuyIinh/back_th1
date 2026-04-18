const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();

router.get("/photosOfUser/:id", async (request, response) => {
  const { id } = request.params;
  try {
    // 1. Tìm tất cả ảnh của user
    const photos = await Photo.find({ user_id: id })
      .populate({
        path: "comments.user_id",
        select: "_id first_name last_name", // chỉ lấy các trường cần thiết
      })
      .lean(); // 👈 chuyển kết quả thành plain JavaScript object

    // 2. Tạo response theo đúng cấu trúc frontend mong đợi
    const result = photos.map((photo) => {
      // Xử lý comments: chuyển từ user_id sang user
      const comments = photo.comments.map((c) => ({
        _id: c._id,
        comment: c.comment,
        date_time: c.date_time,
        user: c.user_id, // đã được populate, chứa object user
        photo_id: photo._id,
      }));
      return {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: comments,
      };
    });

    response.json(result);
  } catch (error) {
    console.error(error);
    response
      .status(400)
      .json({ message: "Lỗi khi lấy ảnh", error: error.message });
  }
});

module.exports = router;
