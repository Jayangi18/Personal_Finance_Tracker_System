const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const schedule = require("node-schedule");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5070;

// Import Routes
const AuthRoute = require("./routes/AuthRoute");
const TransactionRoute = require("./routes/TransactionRoute");
const adminRoute = require("./routes/adminRoute");
const budgetRoute = require("./routes/budgetRoute");
const reportRoute = require("./routes/reportRoute");
const goalRoute = require("./routes/goalRoute");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/auth", AuthRoute);
app.use("/transaction", TransactionRoute);
app.use("/admin", adminRoute);
app.use("/budget", budgetRoute);
app.use("/report", reportRoute);
app.use("/goals", goalRoute);

// Prevent connecting to MongoDB during Jest tests
if (process.env.NODE_ENV !== "test") {
    // Import controllers for scheduled tasks
    const { processRecurringTransactions, checkRecurringTransactions, detectUnusualSpending, remindUpcomingBillsAndGoals } = require("./controllers/transactionController");

    mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => console.log("Connected to MongoDB!"))
        .catch((err) => console.log(err));

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is up and running on port number: ${PORT}`);
    });

    // Start Scheduled Jobs (Runs every midnight) - NOT in test mode
    schedule.scheduleJob("0 0 * * *", async () => {
        console.log("Running daily spending & bill reminders...");
        const users = await UserModel.find({});
        users.forEach(user => detectUnusualSpending(user._id));
        remindUpcomingBillsAndGoals();
    });
}

// Export for Jest testing
module.exports = app;