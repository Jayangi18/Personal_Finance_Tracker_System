const TransactionModel = require("../models/TransactionModel");
const moment = require("moment");

const generateReport = async (req, res) => {
    try {
        console.log("Debugging req.user:", req.user); // Check if req.user exists

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: "Unauthorized - User not authenticated" });
        }

        const { startDate, endDate, category, tags } = req.query; // Get filters from query params

        // Set up filters
        const filter = { userId: req.user.userId };

        if (startDate && endDate) {
            filter.date = { 
                $gte: moment(startDate).startOf("day").toDate(), 
                $lte: moment(endDate).endOf("day").toDate() 
            };
        }

        if (category) {
            filter.category = category;
        }

        if (tags && tags.length > 0) {
            filter.tags = { $in: tags };
        }

        // Fetch transactions based on filters
        const transactions = await TransactionModel.find(filter);

        // Generate income and expense totals
        let totalIncomeLKR = 0;
        let totalExpenseLKR = 0;

        transactions.forEach((transaction) => {
            if (transaction.transactionType === "income") {
                totalIncomeLKR  += transaction.amountInLKR;
            } else if (transaction.transactionType === "expense") {
                totalExpenseLKR  += transaction.amountInLKR;
            }
        });

        // Prepare the report data
        const reportData = {
            totalIncomeLKR,
            totalExpenseLKR,
            balanceLKR: totalIncomeLKR - totalExpenseLKR,
            transactions: transactions.map((txn) => ({
                _id: txn._id,
                transactionType: txn.transactionType,
                category: txn.category,
                amount: txn.amount, // Original amount
                currency: txn.currency, // Original currency
                exchangeRateToLKR: txn.exchangeRateToLKR, // Exchange rate used
                amountInLKR: txn.amountInLKR, // Converted amount in LKR
                description: txn.description,
                date: txn.date,
                tags: txn.tags
            })),
        };

        // Send the report data back as response
        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error generating financial report:", error);
        res.status(500).json({ message: "Error generating financial report", error });
    }
};

module.exports = { generateReport };
