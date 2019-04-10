const express = require("express");
const router = express.Router();

router.post("/all", function(req, res, next) {
  res.send("send all the blockchain");
});

module.exports = router;
