const GoalModel = require("../models/GoalModel");
const TransactionModel = require("../models/TransactionModel");
const axios = require("axios");

const fetchExchangeRate = async (currency) => {
    if (currency === "LKR") return 1; // LKR is the base currency
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${currency}`);
        return response.data.rates["LKR"] || 1; // Convert to LKR
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return 1; // If API fails, assume 1:1 conversion
    }
};

const createGoal = async (req, res) => {
    try {
        console.log("Goal Creation Request Received:", req.body);
        const { title, targetAmount, deadline, autoSavePercentage, currency } = req.body;

        if (!title || !targetAmount || !deadline || !currency) {
            console.log("Missing required fields");
            return res.status(400).json({ error: "Title, targetAmount, deadline and currency are required" });
        }

        const exchangeRate = await fetchExchangeRate(currency);
        const targetAmountInLKR = targetAmount * exchangeRate;
        
        const newGoal = new GoalModel({
            userId: req.user.userId,
            title,
            targetAmount,
            targetAmountInLKR,
            currency,
            exchangeRateToLKR: exchangeRate,
            deadline,
            autoSavePercentage: autoSavePercentage || 0
        });

        await newGoal.save();

        console.log(`Goal Created Successfully: ${title} (ID: ${newGoal._id}) | Target: ${targetAmount} ${currency} ≈ ${targetAmountInLKR} LKR`);
        res.status(201).json({ message: "Goal created successfully", newGoal });

    } catch (error) {
        console.error("Error Creating Goal:", error);
        res.status(500).json({ error: "Error creating goal", details: error.message });
    }
};


const getUserGoals = async (req, res) => {
    try {
        const goals = await GoalModel.find({ userId: req.user.userId });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ error: "Error retrieving goals", details: error.message });
    }
};


const updateGoalProgress = async (req, res) => {
    try {
        console.log("Goal Progress Update Request Received:", req.params, req.body);
        const { goalId } = req.params;
        const { amount, currency} = req.body; // Amount to add to savings

        if (!amount || amount <= 0) {
            console.log("Invalid amount provided:", amount);
            return res.status(400).json({ error: "Amount must be greater than 0" });
        }

        const goal = await GoalModel.findOne({ _id: goalId, userId: req.user.userId });
        if (!goal) {
            console.log(`Goal not found for ID: ${goalId}`);
            return res.status(404).json({ message: "Goal not found" });
        }

        const exchangeRate = await fetchExchangeRate(currency || goal.currency); // Use request currency or goal's existing currency
        const amountInLKR = amount * exchangeRate;

        console.log(`Before Update: Current Amount = ${goal.currentAmount} LKR, Adding = ${amount} ${currency} ≈ ${amountInLKR} LKR`);

        goal.currentAmount += amountInLKR; // Update progress
        await goal.save();

        console.log(`Goal Progress Updated: New Amount = ${goal.currentAmount} LKR`);
        res.status(200).json({ message: "Goal progress updated", goal });

    } catch (error) {
        console.error("Error updating goal progress:", error);
        res.status(500).json({ error: "Error updating goal progress", details: error.message });
    }
};


const deleteGoal = async (req, res) => {
    try {
        console.log("Goal Deletion Request Received:", req.params);
        const { goalId } = req.params;

        const goal = await GoalModel.findOneAndDelete({ _id: goalId, userId: req.user.userId });
        if (!goal) {
            console.log(`Goal not found for ID: ${goalId}`);
            return res.status(404).json({ message: "Goal not found" });
        }

        console.log(`Goal Deleted Successfully: ${goalId}`);
        res.status(200).json({ message: "Goal deleted successfully" });

    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ error: "Error deleting goal", details: error.message });
    }
};


const autoAllocateSavings = async (transaction) => {
    try {
        if (transaction.transactionType !== "income") return; // Only allocate from income

        const exchangeRate = await fetchExchangeRate(transaction.currency);
        const amountInLKR = transaction.amount * exchangeRate;

        const goals = await GoalModel.find({ userId: transaction.userId, autoSavePercentage: { $gt: 0 } });

        for (const goal of goals) {
            const amountToSave = (goal.autoSavePercentage / 100) * amountInLKR;
            goal.currentAmount += amountToSave;
            await goal.save();

            console.log(`Auto-allocated ${amountToSave.toFixed(2)} LKR to goal: ${goal.title} (Goal ID: ${goal._id})`);

        }
    } catch (error) {
        console.error("Error auto-allocating savings:", error);
    }
};

module.exports = { 
    createGoal, 
    getUserGoals, 
    updateGoalProgress, 
    deleteGoal, 
    autoAllocateSavings 
};
