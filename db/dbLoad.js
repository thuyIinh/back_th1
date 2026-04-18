const mongoose = require("mongoose");
require("dotenv").config();

const models = require("../modelData/models.js");

const User = require("./userModel.js");
const Photo = require("./photoModel.js");
const SchemaInfo = require("./schemaInfo.js");

const versionString = "1.0";

async function dbLoad() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.log("Unable to connect to MongoDB Atlas!");
    console.error(error);
    process.exit(1);
  }

  // Xóa dữ liệu cũ
  await User.deleteMany({});
  await Photo.deleteMany({});
  await SchemaInfo.deleteMany({});
  console.log("Old data cleared.");

  const userModels = models.userListModel();
  const mapFakeId2RealId = {};

  // Thêm users
  for (const user of userModels) {
    const userObj = new User({
      first_name: user.first_name, // ✅ đúng tên trường trong schema
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
    });
    try {
      const savedUser = await userObj.save();
      mapFakeId2RealId[user._id] = savedUser._id;
      user.objectID = savedUser._id; // Gán objectID thật cho comment
      console.log(
        "Adding user:",
        user.first_name + " " + user.last_name,
        " with ID ",
        user.objectID,
      );
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // Lấy tất cả ảnh
  const photoModels = [];
  const userIDs = Object.keys(mapFakeId2RealId);
  userIDs.forEach(function (id) {
    photoModels.push(...models.photoOfUserModel(id));
  });

  // Thêm photos và comments
  for (const photo of photoModels) {
    const photoObj = new Photo({
      file_name: photo.file_name,
      date_time: new Date(photo.date_time),
      user_id: mapFakeId2RealId[photo.user_id],
      comments: [],
    });

    if (photo.comments) {
      for (const comment of photo.comments) {
        photoObj.comments.push({
          comment: comment.comment,
          date_time: new Date(comment.date_time),
          user_id: comment.user.objectID, // Đã được gán từ user.objectID
        });
        console.log(
          `Adding comment by user ${comment.user.objectID} to photo ${photo.file_name}`,
        );
      }
    }

    try {
      const savedPhoto = await photoObj.save();
      photo.objectID = savedPhoto._id;
      console.log(
        "Adding photo:",
        photo.file_name,
        " of user ID ",
        photoObj.user_id,
      );
    } catch (error) {
      console.error("Error creating photo:", error);
    }
  }

  // Thêm SchemaInfo
  try {
    const schemaInfo = await SchemaInfo.create({
      version: versionString,
    });
    console.log("SchemaInfo object created with version ", schemaInfo.version);
  } catch (error) {
    console.error("Error creating schemaInfo:", error);
  }

  console.log("✅ Database loading completed.");
  mongoose.disconnect();
}

dbLoad();
