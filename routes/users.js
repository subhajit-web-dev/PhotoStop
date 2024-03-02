const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb+srv://subhajitabc122:Amkn01PskIcMjSpH@photo-stop.beyzcfk.mongodb.net/?retryWrites=true&w=majority&appName=photo-stop");

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
    data: Buffer, // Store binary image data
    contentType: String, // Store mime type of the image
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
    type: String,
    default: null
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
