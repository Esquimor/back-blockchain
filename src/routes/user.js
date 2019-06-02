const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const moment = require("moment");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

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
  User.find({}, function(err, users) {
    if (err) return res.status(500).send("An error has occured");

    res.status(200).send({ users });
  });
});

router.post("/register/email", async function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const confirmation = req.body.confirmation;

  if (password !== confirmation) {
    return res
      .status(500)
      .send("The password is different from the confirmation");
  }

  const existingEmail = await User.findOne({ email: email });
  if (existingEmail) {
    return res.status(500).send("Already existing email");
  }
  const user = new User({ email: email, password: password });
  user.save(err => {
    if (err) {
      return res.status(500).send("An error as occured");
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
            res.status(200).send({ token: generateToken(user), user: user });
          });
        }
      });
    });
  });
});

router.post("/register/facebook", function(req, res, next) {
  var profileFields = ["id", "email"];
  var accessTokenUrl = "https://graph.facebook.com/v2.5/oauth/access_token";
  var graphApiUrl =
    "https://graph.facebook.com/v2.5/me?fields=" + profileFields.join(",");

  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.FACEBOOK_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Exchange authorization code for access token.
  axios.get({ url: accessTokenUrl, qs: params, json: true }, function(
    err,
    response,
    accessToken
  ) {
    if (accessToken.error) {
      return res.status(500).send({ msg: accessToken.error.message });
    }

    // Retrieve user's profile information.
    axios.get({ url: graphApiUrl, qs: accessToken, json: true }, function(
      err,
      response,
      profile
    ) {
      if (profile.error) {
        return res.status(500).send({ msg: profile.error.message });
      }
      // Create a new user account or return an existing one.
      User.findOne({ facebook: profile.id }, function(err, user) {
        if (user) {
          res
            .status(400)
            .send("A user already register with this facebook account");
        } else {
          user = new User({
            facebook: profile.id
          });
          user.save(function(err) {
            return res.send({ token: generateToken(user), user: user });
          });
        }
      });
    });
  });
});

router.post("/login/email", function(req, res, next) {
  const { email, password } = req.body;
  User.findOne({ email }, async function(err, user) {
    if (err || !user) {
      return res.status(500).send("no user found");
    }
    if (await user.comparePassword(password)) {
      axios
        .get(process.env.BLOCKCHAIN_URL + "user/amount", {
          params: {
            address: user.public_key
          }
        })
        .then(({ data }) => {
          return res.status(200).send({
            token: generateToken(user),
            user: {
              email: user.email,
              id: user.id,
              pseudonyme: user.pseudonyme,
              public_key: user.public_key,
              amount: data.amount
            }
          });
        })
        .catch(e => {
          return res.status(500).send("An error has occured");
        });
    } else {
      return res.status(400).send("bad credidential");
    }
  });
});

router.post("/login/google", function(req, res, next) {
  const client = new OAuth2Client(process.env.GOOGLE_SECRET);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.clientId
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];
    User.findOne({ google: userid }, function(err, user) {
      if (err) return res.status(400).send("An error has occured");
      if (!!user) {
        axios
          .get(process.env.BLOCKCHAIN_URL + "/user/amount", {
            address: user.public_key
          })
          .then(({ data }) => {
            return res.status(200).send({
              token: generateToken(user),
              user: {
                google: user.google,
                id: user.id,
                pseudonyme: user.pseudonyme,
                public_key: user.public_key,
                amount: data.amount
              }
            });
          })
          .catch(() => {
            return res.status(500).send("An error has occured");
          });
      } else {
        const user = new User({ google: userid });
        user.save(err => {
          if (err) {
            return res.status(500).send("An error as occured");
          }
          return res
            .status(200)
            .send({ token: generateToken(user), user: user });
        });
      }
    });
  }
  verify().catch(console.error);
});

router.post("/login/facebook", function(req, res, next) {
  const { userId } = req.body;

  User.findOne({ facebook: userId }, function(err, user) {
    if (err) return res.status(400).send("An error has occured");
    if (!!user) {
      axios
        .get(process.env.BLOCKCHAIN_URL + "/user/amount", {
          address: user.public_key
        })
        .then(({ data }) => {
          return res.status(200).send({
            token: generateToken(user),
            user: {
              facebook: user.facebook,
              id: user.id,
              pseudonyme: user.pseudonyme,
              public_key: user.public_key,
              amount: data.amount
            }
          });
        })
        .catch(() => {
          return res.status(500).send("An error has occured");
        });
    } else {
      const user = new User({ facebook: userId });
      user.save(err => {
        if (err) {
          return res.status(500).send("An error as occured");
        }
        return res.status(200).send({ token: generateToken(user), user: user });
      });
    }
  });
});

router.post("/link/email", function(req, res, next) {
  if (!req.user) return res.status(400).send("Forbitten");

  if (!!req.user.email) res.status(400).send("Already email");

  const { email } = req.body;

  User.findByIdAndUpdate(req.user.id, { email }, function(err) {
    if (err) {
      res.status(400).send("An error has occured");
    }
    res.status(200).send("ok");
  });
});

router.post("/link/google", function(req, res, next) {
  if (!req.user) return res.status(400).send("Forbitten");

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
      User.findByIdAndUpdate(req.user.id, { google: profile.sub }, function(
        err
      ) {
        if (err) {
          res.status(400).send("An error has occured");
        }
        res.status(200).send("ok");
      });
    });
  });
});

router.post("/link/facebook", function(req, res, next) {
  if (!req.user) return res.status(400).send("Forbitten");

  var profileFields = ["id", "email"];
  var accessTokenUrl = "https://graph.facebook.com/v2.5/oauth/access_token";
  var graphApiUrl =
    "https://graph.facebook.com/v2.5/me?fields=" + profileFields.join(",");

  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.FACEBOOK_SECRET,
    redirect_uri: req.body.redirectUri
  };

  axios.get({ url: accessTokenUrl, qs: params, json: true }, function(
    err,
    response,
    accessToken
  ) {
    if (accessToken.error) {
      return res.status(500).send({ msg: accessToken.error.message });
    }
    axios.get({ url: graphApiUrl, qs: accessToken, json: true }, function(
      err,
      response,
      profile
    ) {
      if (profile.error) {
        return res.status(500).send({ msg: profile.error.message });
      }
      User.findByIdAndUpdate(req.user.id, { facebook: profile.id }, function(
        err
      ) {
        if (err) {
          res.status(400).send("An error has occured");
        }
        res.status(200).send("ok");
      });
    });
  });
});

router.post("/edit/account", function(req, res, next) {
  if (!req.user) return res.status(400).send("Forbitten");

  const { email, pseudonyme } = req.body;

  User.findByIdAndUpdate(req.user.id, { email, pseudonyme }, function(
    err,
    user
  ) {
    if (err) return res.status(400).send("An error has occured");
    return res.status(200).send("ok");
  });
});

router.post("/edit/password", function(req, res, next) {
  if (!req.user) return res.status(400).send("Forbitten");

  const password = req.body.password;
  const confirmation = req.body.confirmation;

  if (password !== confirmation) {
    res.status(500).send("The password is different from the confirmation");
  }

  User.findById(req.user.id, function(err, user) {
    user.newPassword(password);
    user.save(err => {
      if (err) {
        res.status(500).send("An error as occured");
      }
      res.status(200).send("ok");
    });
  });
});

module.exports = router;
