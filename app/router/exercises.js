const express = require("express");
const router = express.Router();

const exerciseController = require("../controllers/exerciseController");

router.get("/finder/:index", exerciseController.extract_exercies);
router.get("/info", exerciseController.exercise_info)

module.exports = router;