const express = require("express");
const { generateReport } = require("../controllers/financialReportController");
const {authenticateUser} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/financial", authenticateUser, generateReport);

module.exports = router;
