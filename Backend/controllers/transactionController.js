const TransactionModel = require("../models/TransactionModel");
const schedule = require("node-schedule");
const moment = require("moment");
const BudgetModel = require("../models/BudgetModel");
const axios = require("axios"); 

const { autoAllocateSavings } = require("./goalController");

const fetchExchangeRate = async (currency) => {
    if (currency === "LKR") return 1; // LKR is the base currency
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/LKR`);
        return response.data.rates["LKR"] || 1; // Convert to LKR
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return 1; // If API fails, assume 1:1 conversion //320
    }
};  

// const addTransaction = async (req, res) => {
//     try {
//         console.log("Adding New Transaction:", req.body);

//         const { transactionType, category, amount, currency, description, tags, isRecurring, frequency, endDate } = req.body;
//         console.log("Transaction Data: ", { transactionType, category, amount, currency, description, tags, isRecurring, frequency, endDate });

//         const exchangeRate = await fetchExchangeRate(currency);  // Fetch exchange rate
//         const amountInLKR = amount * exchangeRate;

//         const newTransaction = new TransactionModel({
//             userId: req.user.userId,
//             transactionType,
//             category,
//             amount,
//             currency,
//             exchangeRateToLKR: exchangeRate, // Store exchange rate
//             amountInLKR, // Store converted amount in LKR
//             description,
//             tags, // Store custom tags
//             isRecurring, // Check if it's a recurring transaction
//             frequency, // Store frequency
//             endDate // Store end date
//         });
//         await newTransaction.save();

//         console.log(`Transaction saved: ${amount} ${currency} → ${amountInLKR} LKR`);
//         console.log("Transaction Successfully Created:", newTransaction);

//         if (transactionType === "income") {
//             await autoAllocateSavings(newTransaction);
//         }

//         //to check if user exceeds budget after this transaction
//         const budget = await BudgetModel.findOne({
//             userId: req.user.userId,
//             category: category
//         });

//         if (!budget) {
//             console.log(`No budget set for ${category}. Proceeding with the transaction`);
//             return res.status(404).json({ message: "No budget set for this category" });
//         }

//         //cal totalspent with new t
//         const totalSpent = await TransactionModel.aggregate([
//             {
//                 $match: {
//                     userId: req.user.userId,
//                     category: category,
//                     date: { $gte: budget.startDate, $lte: budget.endDate }
//                 }
//             },
//             {
//                 $group: { _id: null, total: { $sum: "$amountInLKR" } }
//             }
//         ]);

//         const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;

//         // Update the budget's spent amount
//         // budget.spent = spent;
//         // await budget.save();    

//         // If the total spent exceeds or nears the budget limit, notify the user
//         if (spent >= budget.amount) {
//             console.log(`User ${req.user.userId} has exceeded their budget for ${category}!`);
//             // Send a notification or store it in the database
//         } else if (spent >= budget.amount * 0.8) {
//             console.log(`User ${req.user.userId} is nearing their budget limit for ${category}.`);
//         }

//         res.status(201).json({message: "Transaction added", newTransaction});

//     } catch (error) {
//         console.error("Error Adding Transaction:", error);
//         res.status(500).json({ message: "Error adding transaction", error: error.message });
//     }
// };

const addTransaction = async (req, res) => {
    try {
        console.log("Adding New Transaction:", req.body);

        const { transactionType, category, amount, currency, description, tags, isRecurring, frequency, endDate } = req.body;
        console.log("Transaction Data: ", { transactionType, category, amount, currency, description, tags, isRecurring, frequency, endDate });

        const exchangeRate = await fetchExchangeRate(currency);  // Fetch exchange rate
        const amountInLKR = amount * exchangeRate;

        const newTransaction = new TransactionModel({
            userId: req.user.userId,
            transactionType,
            category,
            amount,
            currency,
            exchangeRateToLKR: exchangeRate, // Store exchange rate
            amountInLKR, // Store converted amount in LKR
            description,
            tags, // Store custom tags
            isRecurring, // Check if it's a recurring transaction
            frequency, // Store frequency
            endDate // Store end date
        });
        await newTransaction.save();

        console.log(`Transaction saved: ${amount} ${currency} → ${amountInLKR} LKR`);
        console.log("Transaction Successfully Created:", newTransaction);

        if (transactionType === "income") {
            await autoAllocateSavings(newTransaction);
        }

        // to check if user exceeds budget after this transaction
        const budget = await BudgetModel.findOne({
            userId: req.user.userId,
            category: category,
        });

        console.log("Budget Found:", budget);

        let budgetMessage = "";
        if(!budget){
            console.log(`No budget found for category: ${category}`);
            budgetMessage = "Budget not set for this category.";
        }
        else{
            let newSpent = budget.spent + amountInLKR;

            console.log(`Current Spent: ${budget.spent} LKR`);
            console.log(`New Transaction Amount: ${amountInLKR} LKR`);
            console.log(`Updated Spent: ${newSpent} LKR`);
            console.log(`Budget Limit: ${budget.amount} LKR`);

            // Calculate total spent with the new transaction
            // const totalSpent = await TransactionModel.aggregate([
            //     {
            //         $match: {
            //             userId: req.user.userId,
            //             category: category,
            //             date: { $gte: budget.startDate, $lte: budget.endDate }
            //         }
            //     },
            //     {
            //         $group: { 
            //             _id: null, 
            //             total: { $sum: "$amountInLKR" } 
            //         }
            //     }
            // ]);

            // spent = totalSpent.length > 0 ? totalSpent[0].total : 0;

            // console.log('Spent:', spent);
            // console.log('Budget Amount:', budget.amount);

            if (isNaN(newSpent) || isNaN(budget.amount)) {
                // console.log('Error: Invalid spent or budget amount');
                // return;
                console.log(`Error: Invalid values found - Spent: ${newSpent}, Budget Amount: ${budget.amount}`);
                return res.status(500).json({ message: "Error: Invalid spent or budget amount", spent: newSpent, budgetAmount: budget.amount });
            }

            await BudgetModel.updateOne(
                { userId: req.user.userId, category: category },
                { $set: { spent: newSpent } }
            );

            // If the total spent exceeds or nears the budget limit, notify the user
            if (newSpent >= budget.amount) {
                console.log(`User ${req.user.userId} has exceeded their budget for ${category}!`);
                budgetMessage = `User ${req.user.userId} has exceeded their budget for ${category}!`;
            } else if (newSpent >= budget.amount * 0.8) {
                console.log(`User ${req.user.userId} is nearing their budget limit for ${category}.`);
                budgetMessage = `User ${req.user.userId} is nearing their budget limit for ${category}.`;
            }
        }

        
        // Log the final response
        const response = {
            message: "Transaction successfully added",  
            transaction: newTransaction,
            budgetStatus: budgetMessage // Adding the budget status to the response
        };

        console.log("Response sent to Postman:", response);

        res.status(201).json(response); // Send the response including both transaction and budget status

    } catch (error) {
        console.error("Error Adding Transaction:", error);
        res.status(500).json({ message: "Error adding transaction", error: error.message });
    }
};


const getUserTransactions = async(req, res) => {    
    try {
        const {tags, startDate, endDate} = req.query;
        let filter = {};

        console.log("Fetching all transactions before filtering...");
        const transactionsBeforeFilter = await TransactionModel.find();
        console.log("All Transactions in DB:", transactionsBeforeFilter);


        if (req.user.role === 'admin') {
            console.log("Admin is fetching all transactions.");
        } else {    
            filter.userId = req.user.userId;
        }

        console.log('Received query parameters:', req.query);

        if (tags){
            const tagArray = tags.split(",").map(tag => `#${tag.trim()}`);
            filter.tags = { $in: tagArray };
            //filter.tags = {$in: tags.split(",")};
            console.log('Updated Filter after tags:', filter);
        }

        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
            console.log('Updated Filter after date:', filter);
        }

        const transactions = await TransactionModel.find(filter);

        if (transactions.length === 0) {
            return res.status(404).json({ message: "No transactions found for the given criteria" });
        }
        
        console.log(`Found ${transactions.length} transactions matching criteria.`);
        res.status(200).json(transactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({message: "Error fetching transactions", error});
    }
};

const updateTransaction = async(req, res) => {
    try{
        const {transactionId} = req.params;
        const {transactionType, category, amount, description, tags, isRecurring, frequency, endDate} = req.body;

        console.log(`Updating Transaction: ${transactionId}`);

        const updatedTransaction = await TransactionModel.findOneAndUpdate(
            { _id: transactionId, userId: req.user.userId },
            { transactionType, category, amount, description, tags, isRecurring, frequency, endDate },
            { new: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        console.log(`Transaction Updated: ${updatedTransaction._id}`);  
        res.status(200).json({ message: "Transaction updated successfully", updatedTransaction });
    
    } catch (error) {
        res.status(500).json({ message: "Error updating transaction", error });
    } 
};

const deleteTransaction = async (req, res) => {
    try{
        const {transactionId} = req.params;
        const transaction = await TransactionModel.findOneAndDelete({_id: transactionId, userId: req.user.userId});

        if(!transaction) return res.status(404).json({message: "Transaction not found"});

        console.log(`Transaction ${transactionId} deleted successfully.`);
        res.status(200).json({message: "Transaction deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: "Error deleting transaction", error });
    }
};

const processRecurringTransactions = async () => {
    try {
        const today = moment().startOf("day").toDate();

        const recurringTransactions = await TransactionModel.find({
            isRecurring: true,
            date: { $lte: today },
            $or: [
                { endDate: null },
                { endDate: { $gte: today } }
            ]
        });

        if (recurringTransactions.length === 0) {
            console.log("No recurring transactions to process today.");
        }
        
        for (const transaction of recurringTransactions) {
            console.log(`Processing recurring transaction: ${transaction.description} (ID: ${transaction._id})`);

            const exchangeRate = transaction.exchangeRateToLKR || 1; // Use stored rate or default to 1
            const amountInLKR = transaction.amount * exchangeRate;
            // Check if the transaction is due today or in the near future
            if (moment(transaction.date).isSameOrBefore(today)) {
                console.log(`Upcoming Recurring Transaction: ${transaction.description} (ID: ${transaction._id}) is due today or in the near future.`);
            }

            // Create a new instance of the transaction
            const newTransaction = new TransactionModel({
                userId: transaction.userId,
                transactionType: transaction.transactionType,
                category: transaction.category,
                amount: transaction.amount,
                currency: transaction.currency,  // Keep the same currency
                exchangeRateToLKR: exchangeRate, // Store exchange rate
                amountInLKR,
                description: transaction.description,
                tags: transaction.tags,
                isRecurring: true,
                frequency: transaction.frequency,
                endDate: transaction.endDate
            });

            // Set the next occurrence based on frequency
            switch (transaction.frequency) {
                case "daily":
                    newTransaction.date = moment(transaction.date).add(1, "days").toDate();
                    break;
                case "weekly":
                    newTransaction.date = moment(transaction.date).add(1, "weeks").toDate();
                    break;
                case "monthly":
                    newTransaction.date = moment(transaction.date).add(1, "months").toDate();
                    break;
            }

            await newTransaction.save();

            console.log(`Recurring Transaction Processed: ${newTransaction.description} (ID: ${newTransaction._id}) for ${newTransaction.date}`);
        }

        console.log("Recurring transactions processed successfully");
    } catch (error) {
        console.error("Error processing recurring transactions:", error);
    }
};

const checkRecurringTransactions = async () => {
    try {
        const today = moment().startOf("day");
        const upcomingDate = moment().add(3, "days").endOf("day"); // Check for next 3 days

        console.log("Checking for upcoming and missed transactions...");

        //Find Upcoming Recurring Transactions
        const upcomingTransactions = await TransactionModel.find({
            isRecurring: true,
            date: { $gte: today.toDate(), $lte: upcomingDate.toDate() }
        });

        upcomingTransactions.forEach(transaction => {
            console.log(`Reminder: Upcoming transaction of ${transaction.amount} for ${transaction.category} on ${moment(transaction.date).format("YYYY-MM-DD")}`);
        });

        //Find Missed Transactions (Due Date Passed)
        const missedTransactions = await TransactionModel.find({
            isRecurring: true,
            date: { $lt: today.toDate() }
        });

        missedTransactions.forEach(transaction => {
            console.log(`ALERT: Missed transaction of ${transaction.amount} for ${transaction.category} (Due Date: ${moment(transaction.date).format("YYYY-MM-DD")})`);
        });

    } catch (error) {
        console.error("Error checking recurring transactions:", error);
    }
};

// schedule.scheduleJob("0 0 * * *", processRecurringTransactions);
// schedule.scheduleJob("0 0 * * *", checkRecurringTransactions);

const detectUnusualSpending = async (userId) => {
    try {
        console.log("Running unusual spending check for user:", userId);
        const transactions = await TransactionModel.find({ userId, transactionType: "expense" });

        if (transactions.length === 0) {
            console.log("No expenses found for this user.");
            return;
        }

        const categorySpending = {};
        
        // Calculate total and average spending per category
        transactions.forEach((txn) => {
            if (!categorySpending[txn.category]) {
                categorySpending[txn.category] = { total: 0, count: 0 };
            }
            categorySpending[txn.category].total += txn.amount;
            categorySpending[txn.category].count += 1;
        });

        // Compare latest transaction with the average
        const latestTransaction = transactions[transactions.length - 1];
        console.log("Latest transaction:", latestTransaction);
        const category = latestTransaction.category;
        const avgSpending = categorySpending[category].total / categorySpending[category].count;
        const threshold = avgSpending * 1.3; // 30% higher than average

        console.log(`Avg spending in ${category}: ${avgSpending.toFixed(2)} | Threshold: ${threshold.toFixed(2)}`);

        if (latestTransaction.amount > threshold) {
            console.log(`ALERT: Unusual spending detected! You spent ${latestTransaction.amount} on ${category}, which is higher than your average (${avgSpending.toFixed(2)}).`);
        } else {
            console.log("No unusual spending detected.");
        }

    } catch (error) {
        console.error("Error detecting unusual spending:", error);
    }
};

const remindUpcomingBillsAndGoals = async () => {
    try {
        const today = moment().startOf("day");
        const upcomingDate = moment().add(3, "days").endOf("day");

        console.log("Checking for upcoming bills and financial goals...");

        const upcomingTransactions = await TransactionModel.find({
            isRecurring: true,
            date: { $gte: today.toDate(), $lte: upcomingDate.toDate() },
            $or: [{ category: "Bills" }, { category: "Goals" }]
        });

        upcomingTransactions.forEach((transaction) => {
            console.log(`Reminder: Your ${transaction.category} payment of ${transaction.amount} is due on ${moment(transaction.date).format("YYYY-MM-DD")}.`);
        });

    } catch (error) {
        console.error("Error checking upcoming bills/goals:", error);
    }
};

//normal
// schedule.scheduleJob("0 0 * * *", processRecurringTransactions);
// schedule.scheduleJob("0 0 * * *", checkRecurringTransactions);

//test
if (process.env.NODE_ENV !== "test") { 
    schedule.scheduleJob("0 0 * * *", processRecurringTransactions);
    schedule.scheduleJob("0 0 * * *", checkRecurringTransactions);
}


module.exports = { 
    addTransaction,
    getUserTransactions,
    updateTransaction,
    deleteTransaction,
    processRecurringTransactions,
    checkRecurringTransactions,
    detectUnusualSpending,
    remindUpcomingBillsAndGoals
};
