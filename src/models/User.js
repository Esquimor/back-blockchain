const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ec } = require("elliptic");
const EC = new ec("secp256k1");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String
  },
  password: String,
  facebook: String,
  google: String,
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

  const keyPair = EC.genKeyPair();
  const privateKey = keyPair.getPrivate();
  user.private_key = privateKey.toString(16);

  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
