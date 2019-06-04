const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const dotenv = require("dotenv");
const User = require("./models/User");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

// Env Variable
const httpPort = parseInt(process.env.HTTP_PORT) || 8000;

const initHttpServer = myHttpPort => {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  app.use(function(req, res, next) {
    req.isAuthenticated = function() {
      const token =
        (req.headers.authorization &&
          req.headers.authorization.split(" ")[1]) ||
        (req.cookies && req.cookies.token);
      try {
        return jwt.verify(token, process.env.TOKEN_SECRET);
      } catch (err) {
        return false;
      }
    };
    if (req.isAuthenticated()) {
      const payload = req.isAuthenticated();
      User.findById(payload.data, function(err, user) {
        if (!err) req.user = user;
        next();
      });
    } else {
      next();
    }
  });

  // Route
  const indexRouter = require("./routes/index");
  const userRouter = require("./routes/user");
  const blockchainRouter = require("./routes/blockchain");
  const transactionRouter = require("./routes/transaction");

  app.use("/", indexRouter);
  app.use("/user", userRouter);
  app.use(
    "/blockchain",
    function(req, res, next) {
      if (!req.user) return res.status(400).send("Forbitten");
      next();
    },
    blockchainRouter
  );
  app.use("/transaction", transactionRouter);

  // Start Server
  app.listen(myHttpPort, () => {
    console.log("Listening http on port: " + myHttpPort);
  });
};

const initMongodb = () => {
  const mongoDB = "mongodb://127.0.0.1/blockchain_backend";
  mongoose.connect(mongoDB, { useNewUrlParser: true });

  //Get the default connection
  const db = mongoose.connection;

  //Bind connection to error event (to get notification of connection errors)
  db.on("error", console.error.bind(console, "MongoDB connection error:"));
};

dotenv.config();

initHttpServer(httpPort);
initMongodb();
