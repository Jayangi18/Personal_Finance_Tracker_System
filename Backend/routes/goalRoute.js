const express = require("express");
const { authenticateUser } = require("../middlewares/authMiddleware");
const { createGoal, getUserGoals, updateGoalProgress, deleteGoal } = require("../controllers/goalController");

const router = express.Router();

// Routes for goal management
router.post("/createGoal", authenticateUser, createGoal);
router.get("/getUserGoals", authenticateUser, getUserGoals);
router.put("/updateGoalProgress/:goalId", authenticateUser, updateGoalProgress);
router.delete("/deleteGoal/:goalId", authenticateUser, deleteGoal);

module.exports = router;
