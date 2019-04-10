const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String
  },
  password: String,
  facebook: String,
  google: String,
  public_key: String,
  private_key: String
});

userSchema.pre("save", async function(next) {
  var user = this;
  if (!user.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
