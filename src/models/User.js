const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password: String,
  facebook: String,
  google: String,
  public_key: String,
  private_key: String
});

const User = mongoose.model("Blog", blogSchema);

module.exports = User;
