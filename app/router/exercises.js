const express = require("express");
const router = express.Router();

const exerciseController = require("../controllers/exerciseController");

router.get("/", exerciseController.sayHello);

module.exports = router;