const express = require("express");

const {authenticateUser} = require("../middlewares/authMiddleware");

const {setBudget, getUserBudgets, updateBudgetAmount, deleteBudget} = require("../controllers/budgetController");

const router = express.Router();

router.post("/setBudget", authenticateUser, setBudget); 

router.get("/getUserBudgets", authenticateUser, getUserBudgets);

router.put("/updateBudgetAmount/:budgetId", authenticateUser, updateBudgetAmount);

router.delete("/deleteBudget/:budgetId", authenticateUser, deleteBudget);

router.post('/budget-check', authenticateUser, async (req, res) => {
    console.log('User Info:', req.user);  // Check if user info is attached correctly
    res.send('Budget check route hit'); // Optional, just to check the response
});

module.exports = router;