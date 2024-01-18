const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1//pinterest-lite");

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
  boards : {
    type: Array,
    default: []
  }
});

module.exports = mongoose.model("user", userSchema);