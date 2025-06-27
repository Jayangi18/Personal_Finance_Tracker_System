const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, // Link to user
    transactionType: {
        type: String,
        enum: ["income", "expense"],
        required: true,
    },
    category: {
        type: String,
        required: true,  //if not needed- false
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "LKR"  // Default currency is Sri Lankan Rupees
    },
    exchangeRateToLKR: {
        type: Number,
        default: 1  // Default 1 for LKR transactions
    },
    amountInLKR: {
        type: Number,
        required: true // Store converted amount in LKR
    },
    description: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: [String],
        default: []
    }, //custom tags
    isRecurring: { 
        type: Boolean, 
        default: false 
    }, //indicate if it's a recurring transaction
    frequency: { 
        type: String, 
        enum: ["daily", "weekly", "monthly"], 
        default: null 
    }, 
    endDate: { 
        type: Date, 
        default: null 
    } // When the recurring transaction should stop
},
{timestamps: true}
);

// console.log("hi");
// console.log("hi");

// Export the model
const TransactionModel = mongoose.model("Transaction", transactionSchema);
module.exports = TransactionModel;
