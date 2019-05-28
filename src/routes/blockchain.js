const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/all", function(req, res, next) {
  axios
    .get(process.env.BLOCKCHAIN_URL + "/blockchain")
    .then(({ data }) => {
      res.status(200).send({ blockchain: data.blockchain });
    })
    .cath(() => {
      res.status(400).send("An error has occured");
    });
});

module.exports = router;
