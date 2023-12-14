const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

const exerciseRouter = require("./router/exercises");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors())

app.use("/exercises", exerciseRouter);

app.get("/", (req, res) => {
    res.json({message: "Everything is working!"})
})

app.listen(process.env.DEVELOPMENT_PORT, () =>
  console.log("Server running on port: ", process.env.DEVELOPMENT_PORT)
);
