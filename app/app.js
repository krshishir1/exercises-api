const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");

const exerciseRouter = require("./router/exercises");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/exercises", exerciseRouter);

app.get("/", (req, res) => {
  res.json({ message: "Everything is working!" });
});

// console.log(process.env.DATABASE_URI)

mongoose.connect(process.env.DATABASE_URI).then(() => {
  app.listen(process.env.DEVELOPMENT_PORT, () =>
    console.log("Server running on port: ", process.env.DEVELOPMENT_PORT)
  );
}) .catch((err) => console.log(err.message))
