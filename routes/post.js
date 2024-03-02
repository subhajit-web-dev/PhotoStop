const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  caption: String,
  image: {
    data: Buffer, // Store binary image data
    contentType: String // Store mime type of the image
  },
  likeCount: {
    type: Number,
    default: 0
  },
  likedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ]
});

module.exports = mongoose.model("post", postSchema);
