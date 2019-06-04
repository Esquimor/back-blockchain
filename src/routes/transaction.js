const express = require("express");
const router = express.Router();
const axios = require("axios");

const User = require("./../models/User");

router.post("/create", function(req, res, next) {
  const { receiver, amount, id } = req.body;
  User.findById(id, function(err, user) {
    if (err || !user) return res.status(500).send("An error has occured");
    axios
      .post(process.env.BLOCKCHAIN_URL + "block/add", {
        privateKey: user.private_key,
        addressReceving: receiver,
        amount
      })
      .then(() => {
        return res.status(200).send("ok");
      })
      .catch(() => {
        return res.status(500).send("An error has occured");
      });
  });
});

router.post("/buy", function(req, res) {
  const { amount, id } = req.body;

  User.findById(id, function(err, user) {
    if (err || !user) return res.status(500).send("An error has occured");
    axios
      .post(process.env.BLOCKCHAIN_URL + "amount/add", {
        addressReceving: user.public_key,
        amount
      })
      .then(() => {
        return res.status(200).send("ok");
      })
      .catch(e => {
        console.log(e);
        return res.status(500).send("An error has occured");
      });
  });
});

module.exports = router;
