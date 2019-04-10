const express = require("express");
const router = express.Router();

/* GET users listing. */
router.get("/all", function(req, res, next) {
  res.json("Send all users");
});

router.post("/register/email", function(req, res, next) {
  res.json("create a new user");
});

router.post("/register/google", function(req, res, next) {
  res.json("create a new user with google");
});

router.post("/register/facebook", function(req, res, next) {
  res.json("create a new user with facebook");
});

router.post("/login/email", function(req, res, next) {
  res.json("login a user with email");
});

router.post("/login/google", function(req, res, next) {
  res.json("login a user with google");
});

router.post("/login/facebook", function(req, res, next) {
  res.json("login a user with facebook");
});

router.post("/link/email", function(req, res, next) {
  res.json("link a account to a email adress");
});

router.post("/link/google", function(req, res, next) {
  res.json("link a account to a google account");
});

router.post("/link/facebook", function(req, res, next) {
  res.json("link a account to a facebook account");
});

router.post("/edit/account", function(req, res, next) {
  res.json("edit the user");
});

router.post("/edit/password", function(req, res, next) {
  res.json("change the user password");
});

module.exports = router;
