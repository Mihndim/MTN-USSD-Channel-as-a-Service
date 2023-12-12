const express = require("express");
const xmlPages = require("../controllers/controllers.js");

const router = express.Router();

router.post("/checkBill", pagesController.checkBill);

router.post("/settleRfp", pagesController.settleRfp);

module.exports = router;
