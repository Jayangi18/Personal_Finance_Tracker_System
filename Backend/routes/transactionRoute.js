const express = require("express");
const router = express.Router();


const { authenticateUser } = require("../middlewares/authMiddleware");  // Check filename casing

const { addTransaction, getUserTransactions, updateTransaction, deleteTransaction, 
    checkRecurringTransactions, detectUnusualSpending } = require("../controllers/transactionController"); // Check filename casing

router.post("/addTransaction", authenticateUser, addTransaction);

router.get("/getUserTransactions", authenticateUser, getUserTransactions);

router.put("/updateTransaction/:transactionId", authenticateUser, updateTransaction);

router.delete("/deleteTransaction/:transactionId", authenticateUser, deleteTransaction);

router.get("/check-recurring", authenticateUser, async (req, res) => {
    try {
        await checkRecurringTransactions();
        res.status(200).json({ message: "Recurring transactions checked. See console logs for details." });
    } catch (error) {
        res.status(500).json({ error: "Error checking recurring transactions", details: error.message });
    }
});

router.get("/check-unusual-spending", authenticateUser, async (req, res) => {
    try {
        await detectUnusualSpending(req.user.userId);
        res.status(200).json({ message: "Unusual spending check completed. See console logs for details." });
    } catch (error) {
        res.status(500).json({ error: "Error checking unusual spending", details: error.message });
    }
});

module.exports = router;
