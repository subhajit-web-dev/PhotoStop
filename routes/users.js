const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/pinterestlite");

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  profileImage: {
    type: String
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ],
  savedPost:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ],
  secret: {
    type: String
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);