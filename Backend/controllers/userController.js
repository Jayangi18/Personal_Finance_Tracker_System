const UserModel = require("../models/UserModel");
const mongoose = require("mongoose");
const TransactionModel = require("../models/TransactionModel");
const BudgetModel = require("../models/BudgetModel");
const GoalModel = require("../models/GoalModel");

//get all users - admin
const getAllUsers = async(req, res) => {
    try {
        const users = await UserModel.find({}, "-password"); //exclude password
        console.log("Fetch users: ", users);
        res.status(200).json(users);
    } catch (error) {
        console.log("Error fetching users: ", error);
        res.status(500).json({message: "Error fetching users", error});
    }
};

//delete user - admin
const deleteUser = async(req, res) => {
    try {
        const {userId} = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const user = await UserModel.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User deleted successfully:", user);
        res.status(200).json({message: "User deleted successfully"});
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({message: "Error deleting user", error});
    }
};

//update user role - admin
const updateUserDetails = async(req, res) => {
    try {
        const { userId } = req.params;
        const { userName, email, role } = req.body;
        const requesterRole = req.user.role;  // Role of the person making the request-nnn
        const requesterId = req.user.userId;  // ID of the person making the request-nnn

        console.log(`User Role: ${requesterRole}, Requester ID: ${requesterId}, Target User ID: ${userId}`);

        //If user is NOT admin, they can only update their own profile-nnn
        if (requesterRole !== "admin" && requesterId !== userId) {
            return res.status(403).json({ message: "Access denied. You can only update your own profile." });
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        // Build update object dynamically (so we only update provided fields)
        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        //if (role && ["admin", "user"].includes(role)) updateData.role = role; // Only update role if valid

        //Users CANNOT update their role, only admins can
        if (role) {
            if (requesterRole === "admin") {
                if (["admin", "user"].includes(role)) {
                    updateData.role = role;
                } else {
                    return res.status(400).json({ message: "Invalid role value" });
                }
            } else {
                return res.status(403).json({ message: "You are not allowed to update your role." });
            }
        }

        // Ensure there's data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        // Find and update user
        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User details updated successfully:", updatedUser); 
        res.status(200).json({ message: "User details updated successfully", updatedUser });

    } catch (error) {
        console.error("Error updating user details:", error);
        res.status(500).json({ message: "Error updating user details", error });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        console.log(`Fetching dashboard data for User ID: ${userId}, Role: ${userRole}`);

        // **Admin Dashboard**
        if (userRole === "admin") {
            const totalUsers = await UserModel.countDocuments();
            const totalTransactions = await TransactionModel.countDocuments();
            const totalIncome = await TransactionModel.aggregate([
                { $match: { transactionType: "income" } },
                { $group: { _id: null, total: { $sum: "$amountInLKR" } } }
            ]);
            const totalExpenses = await TransactionModel.aggregate([
                { $match: { transactionType: "expense" } },
                { $group: { _id: null, total: { $sum: "$amountInLKR" } } }
            ]);

            const adminDashboardData = {
                role: "admin",
                totalUsers,
                totalTransactions,
                totalIncome: totalIncome[0]?.total || 0,
                totalExpenses: totalExpenses[0]?.total || 0,
                financialSummary: totalIncome[0]?.total - (totalExpenses[0]?.total || 0),
            };

            console.log("Admin Dashboard Data:", adminDashboardData);

            return res.status(200).json(adminDashboardData);
        }

        // **Regular User Dashboard**
        const userTransactions = await TransactionModel.find({ userId });
        const userBudgets = await BudgetModel.find({ userId });
        const userGoals = await GoalModel.find({ userId });

        const totalUserIncome = userTransactions
            .filter(txn => txn.transactionType === "income")
            .reduce((sum, txn) => sum + txn.amountInLKR, 0);

        const totalUserExpenses = userTransactions
            .filter(txn => txn.transactionType === "expense")
            .reduce((sum, txn) => sum + txn.amountInLKR, 0);

            const userDashboardData = {
                role: "user",
                transactions: userTransactions.length,
                totalIncome: totalUserIncome,
                totalExpenses: totalUserExpenses,
                balance: totalUserIncome - totalUserExpenses,
                budgets: userBudgets,
                goals: userGoals,
            };
    
            console.log("User Dashboard Data:", userDashboardData);
    
            res.status(200).json(userDashboardData);

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Error fetching dashboard data" });
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    updateUserDetails,
    getDashboardData
};
