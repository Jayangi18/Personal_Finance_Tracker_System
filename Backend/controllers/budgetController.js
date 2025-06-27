const BudgetModel = require("../models/BudgetModel");
const TransactionModel = require("../models/TransactionModel");
const mongoose = require("mongoose");
const moment = require("moment");
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

//set budget
const setBudget = async (req, res) => {
    try{
        const {category, amount, startDate, endDate, currency="LKR"} = req.body;

        const exchangeRate = await fetchExchangeRate(currency);
        const amountInLKR = amount * exchangeRate;

        // Convert dates to Date objects if they are in string format
        const start = new Date(startDate);
        const end = new Date(endDate);

        console.log("Calculated amountInLKR:", amountInLKR); // Check if it's calculated correctly

        // Check if budget already exists for the given category & time frame
        let budget = await BudgetModel.findOne({ 
            userId: req.user.userId, 
            category, 
            startDate: { $lte: end },   // Budget should start before or on the given end date
            endDate: { $gte: start }    // Budget should end after or on the given start date
        });

        if (budget) {
            budget.amount = amountInLKR;
            budget.currency = currency;
            budget.exchangeRateToLKR = exchangeRate;

            await budget.save();

            console.log(`Budget updated for ${category}: ${amount} ${currency} → ${amountInLKR} LKR from ${startDate} to ${endDate}`);
            return res.status(200).json({ message: "Budget updated", budget });
        }

        const newBudget = new BudgetModel({
            userId: req.user.userId,
            category,
            amount: amountInLKR,
            currency,
            exchangeRateToLKR: exchangeRate,
            startDate: start,
            endDate: end,
            amountInLKR
        });

        await newBudget.save();
        console.log(`New budget set: ${category} - Amount: ${amount} ${currency} → ${amountInLKR} LKR from ${startDate} to ${endDate}`);
        res.status(201).json({ message: "Budget set successfully", newBudget });
        
    } catch(error) {
        console.error("Error setting budget:", error);
        res.status(500).json({ message: "Error setting budget", error });
    }
};

const getUserBudgets = async (req, res) => {
    try {
        console.log(`Fetching budgets for user: ${req.user.userId}`);
        const budgets = await BudgetModel.find({ userId: req.user.userId });

        console.log("Budgets retrieved:", budgets);
        res.status(200).json(budgets);
    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(500).json({ message: "Error fetching budgets", error });
    }   
};

const updateBudgetAmount = async (req, res) => {
    try {
        const { budgetId } = req.params;
        const { amount, currency = "LKR" } = req.body;

        console.log("Debugging: Received budgetId from request:", budgetId);
        console.log("Debugging: Logged-in userId from token:", req.user.userId);

        // Ensure budgetId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(budgetId)) {
            console.log("Debugging: Invalid budgetId format!");
            return res.status(400).json({ message: "Invalid budget ID format" });
        }

        const exchangeRate = await fetchExchangeRate(currency);
        const amountInLKR = amount * exchangeRate;

        const budgetCheck = await BudgetModel.findOne({ _id: budgetId, userId: req.user.userId });


        if (!budgetCheck) {
            console.log("Debugging: No budget found with this ID.");
            return res.status(404).json({ message: "Budget not found" });
        }

        const updatedBudget = await BudgetModel.findOneAndUpdate(
            { _id: budgetId, userId: req.user.userId },
            { amount: amountInLKR, exchangeRateToLKR: exchangeRate },
            { new: true } // Return updated document
        );

        if (!updatedBudget) {
            console.log("Debugging: Budget exists, but user does not own it.");
            return res.status(404).json({ message: "Budget not found" });
        }

        console.log(`Budget amount updated: ${amount} ${currency} → ${amountInLKR} LKR`);
        res.status(200).json({ message: "Budget amount updated successfully", updatedBudget });

    } catch (error) {
        console.error("Error updating budget amount:", error);
        res.status(500).json({ message: "Error updating budget amount", error });
    }
};


const deleteBudget = async (req, res) => {
    try {
        const { budgetId } = req.params;

        const deletedBudget = await BudgetModel.findOneAndDelete({ _id: budgetId, userId: req.user.userId });

        if (!deletedBudget) {
            return res.status(404).json({ message: "Budget not found" });
        }
        console.log(`Budget deleted: ${budgetId}`);
       // await BudgetModel.findOneAndDelete({ _id: budgetId, userId: req.user.userId });
        res.status(200).json({ message: "Budget deleted successfully" });
    } catch (error) {
        console.error("Error deleting budget:", error);
        res.status(500).json({ message: "Error deleting budget", error });
    }
};

module.exports = {
    setBudget,
    getUserBudgets,
    updateBudgetAmount,
    deleteBudget
};
