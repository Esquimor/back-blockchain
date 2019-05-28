const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/create", function(req, res, next) {
  const { addressReceving, amount } = req.body;
  axios.post(process.env.BLOCKCHAIN_URL + "/block/add", {
    privateKey: req.user.privateKey,
    addressReceving,
    amount
  });
});

module.exports = router;
