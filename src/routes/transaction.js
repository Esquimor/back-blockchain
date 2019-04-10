const express = require("express");
const router = express.Router();

router.post("/create", function(req, res, next) {
  res.send("create a new transaction");
});

module.exports = router;
