const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");

// Env Variable
const httpPort = parseInt(process.env.HTTP_PORT) || 8000;

const initHttpServer = myHttpPort => {
  const app = express();
  app.use(bodyParser.json());

  // Route
  const indexRouter = require("./routes/index");
  const userRouter = require("./routes/user");
  const blockchainRouter = require("./routes/blockchain");
  const transactionRouter = require("./routes/transaction");

  app.use("/", indexRouter);
  app.use("/user", userRouter);
  app.use("/blockchain", blockchainRouter);
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

initHttpServer(httpPort);
initMongodb();
