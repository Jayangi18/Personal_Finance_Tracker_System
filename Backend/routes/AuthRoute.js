const express = require("express");
const {registerUser, loginUser} = require("../controllers/authentiController");

const router = express.Router();

//user registration route
router.post("/register", registerUser);

//user login route
router.post("/login", loginUser);

module.exports = router;