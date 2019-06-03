const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ec } = require("elliptic");
const EC = new ec("secp256k1");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String
  },
  pseudonyme: String,
  password: { type: String },
  facebook: String,
  google: String,
  private_key: String,
  public_key: String
});

userSchema.pre("save", async function(next) {
  var user = this;
  if (!user.privateKey && !user.public_key) {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    user.private_key = privateKey.toString(16);
    const key = EC.keyFromPrivate(privateKey, "hex");
    user.public_key = key.getPublic().encode("hex");
  }

  if (!user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

userSchema.methods.comparePassword = async function(password) {
  try {
    const samePassword = await bcrypt.compare(password, this.password);
    return samePassword;
  } catch (e) {
    return false;
  }
};

userSchema.methods.newPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
