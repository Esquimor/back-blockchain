const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const moment = require("moment");

const User = require("./../models/User");

function generateToken(user) {
  const payload = {
    iss: "supbank.com",
    data: user.id,
    iat: moment().unix(),
    exp: moment()
      .add(7, "days")
      .unix()
  };
  return jwt.sign(payload, process.env.TOKEN_SECRET);
}

router.get("/all", function(req, res, next) {
  res.json("Send all users");
});

router.post("/register/email", async function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const confirmation = req.body.confirmation;

  if (password !== confirmation) {
    res.status(500).send("The password is different from the confirmation");
  }

  const existingEmail = await User.findOne({ email: email });
  if (existingEmail) {
    res.status(500).send("Already existing email");
  }
  const user = new User({ email: email, password: password });
  user.save(err => {
    if (err) {
      res.status(500).send("An error as occured");
    }
    res.status(200).send({ token: generateToken(user), user: user });
  });
});

router.post("/register/google", function(req, res, next) {
  const accessTokenUrl = "https://accounts.google.com/o/oauth2/token";
  const peopleApiUrl =
    "https://www.googleapis.com/plus/v1/people/me/openIdConnect";

  const params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: "authorization_code"
  };

  axios.post(accessTokenUrl, { json: true, form: params }, function(
    err,
    response,
    token
  ) {
    var accessToken = token.access_token;
    var headers = { Authorization: "Bearer " + accessToken };
    axios.get({ url: peopleApiUrl, headers: headers, json: true }, function(
      err,
      response,
      profile
    ) {
      if (profile.error) {
        return res.status(500).send({ message: profile.error.message });
      }
      User.findOne({ google: profile.sub }, function(err, user) {
        if (user) {
          return res
            .status(400)
            .send("An user already exist with this google account");
        } else {
          user = new User({
            google: profile.sub
          });
          user.save(function(err) {
            res.statu(200).send({ token: generateToken(user), user: user });
          });
        }
      });
    });
  });
});

router.post("/register/facebook", function(req, res, next) {
  res.json("create a new user with facebook");
});

router.post("/login/email", function(req, res, next) {
  res.json("login a user with email");
});

router.post("/login/google", function(req, res, next) {
  const accessTokenUrl = "https://accounts.google.com/o/oauth2/token";
  const peopleApiUrl =
    "https://www.googleapis.com/plus/v1/people/me/openIdConnect";

  const params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: "authorization_code"
  };

  axios.post(accessTokenUrl, { json: true, form: params }, function(
    err,
    response,
    token
  ) {
    var accessToken = token.access_token;
    var headers = { Authorization: "Bearer " + accessToken };
    axios.get({ url: peopleApiUrl, headers: headers, json: true }, function(
      err,
      response,
      profile
    ) {
      if (profile.error) {
        return res.status(500).send({ message: profile.error.message });
      }
      User.findOne({ google: profile.sub }, function(err, user) {
        if (user) {
          return res
            .status(200)
            .send({ token: generateToken(user), user: user });
        }
        return res.status(400).send("User not found");
      });
    });
  });
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
