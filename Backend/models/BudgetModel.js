const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    category: {
        type: String,
        required: false  //optional
    }, 
    amount: { 
        type: Number, 
        required: true 
    }, //limit
    amountInLKR: {
        type: Number,
        required: true
    }, // Converted budget amount in LKR
    currency: {
        type: String,
        default: "LKR"  // Default currency is Sri Lankan Rupees
    },
    exchangeRateToLKR: {
        type: Number,
        default: 1  // Default 1 for LKR budgets
    },
    spent: {
        type: Number,
        default: 0 //track spending against budget
    },
    startDate: { 
        type: Date, 
        required: true 
    }, // Start of budget period
    endDate: { 
        type: Date, 
        required: true 
    } // End of budget period
}, {timestamps: true}
);

// console.log("hi");
// console.log("hi");

// Export the model
const BudgetModel = mongoose.model("BudgetModel", budgetSchema);
module.exports = BudgetModel;