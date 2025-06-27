const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    }, 
    targetAmount: { 
        type: Number, 
        required: true 
    }, //amount to save
    currentAmount: { 
        type: Number, 
        default: 0 
    }, //saved so far
    deadline: { 
        type: Date, 
        required: true 
    }, //date to reach goal
    autoSavePercentage: { 
        type: Number, 
        default: 0 
    }, // 
    // Auto allocation % from income
    
}, { timestamps: true });

const GoalModel = mongoose.model("Goal", goalSchema);
module.exports = GoalModel;
