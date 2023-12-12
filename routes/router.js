const express = require("express");
const pagesController = require("../controllers/pagesController.js");

const router = express.Router();

router.post("/checkBill", pagesController.checkBill);

router.post("/settleRfp", pagesController.settleRfp);

module.exports = router;
