jest.setTimeout(150000); // Increase timeout for MongoDB Memory Server

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../server");
const UserModel = require("../models/UserModel");
const TransactionModel = require("../models/TransactionModel");
const BudgetModel = require("../models/BudgetModel");
const GoalModel = require("../models/GoalModel");
const jwt = require("jsonwebtoken");

let mongoServer;
let authToken;
let testUserId;

beforeAll(async () => {
    //Set up in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("Test Database Connected");

    //Create a test user
    testUserId = new mongoose.Types.ObjectId();
    const testUser = new UserModel({
        _id: testUserId,
        userName: "testuser",
        email: "test@example.com",
        password: "testpassword",
        role: "user"
    });
    await testUser.save();

    //Generate JWT Token
    authToken = `Bearer ${jwt.sign({ userId: testUserId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" })}`;

    console.log("Test JWT Token:", authToken);
});

beforeEach(async () => {
    //Clear all collections before each test
    await TransactionModel.deleteMany();
    await BudgetModel.deleteMany();
    await GoalModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Test Database Disconnected");
});

describe("Full System Integration Tests", () => {

    // Test Case: Create and Retrieve a Transaction**
    it("Should create a transaction and fetch it", async () => {
        const newTransaction = {
            transactionType: "expense",
            category: "Food",
            amount: 5000,
            currency: "LKR",
            description: "Dinner",
            tags: ["restaurant"],
            isRecurring: false
        };

        // **1️. Create Transaction**
        let response = await request(app)
            .post("/transaction/addTransaction")
            .set("Authorization", authToken)
            .send(newTransaction);
        
        expect(response.status).toBe(201);
        expect(response.body.transaction).toHaveProperty("_id");
        const transactionId = response.body.transaction._id;

        // **2️. Fetch Transactions**
        response = await request(app)
            .get("/transaction/getUserTransactions")
            .set("Authorization", authToken);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0]._id).toBe(transactionId);
    });

    //Test Case: Set a Budget and Verify Updates**
    it("Should set a budget and check if a transaction exceeds it", async () => {
        const budget = {
            category: "Food",
            amount: 10000,
            startDate: "2025-03-01",
            endDate: "2025-03-31"
        };

        // **1️.  Budget**
        let response = await request(app)
            .post("/budget/setBudget")
            .set("Authorization", authToken)
            .send(budget);

        expect(response.status).toBe(201);
        expect(response.body.newBudget.category).toBe("Food");

        // **2️. Create Expense That Exceeds Budget**
        const transaction = {
            transactionType: "expense",
            category: "Food",
            amount: 12000,
            currency: "LKR",
            description: "Luxury Dinner",
            tags: ["restaurant"],
            isRecurring: false
        };

        response = await request(app)
            .post("/transaction/addTransaction")
            .set("Authorization", authToken)
            .send(transaction);

        expect(response.status).toBe(201);
        expect(response.body.budgetStatus).toContain("exceeded");
    });

    //Test Case: Create and Manage a Goal**
    it("Should create a goal, update savings, and delete it", async () => {
        const newGoal = {
            title: "Buy a Car",
            targetAmount: 5000000,
            deadline: "2025-12-31",
            autoSavePercentage: 10,
            currency: "LKR"
        };

        // **1️. Create Goal**
        let response = await request(app)
            .post("/goals/createGoal")
            .set("Authorization", authToken)
            .send(newGoal);

        expect(response.status).toBe(201);
        expect(response.body.newGoal.title).toBe("Buy a Car");
        const goalId = response.body.newGoal._id;

        // **2. Goal Progress**
        response = await request(app)
            .put(`/goals/updateGoalProgress/${goalId}`)
            .set("Authorization", authToken)
            .send({ amount: 100000, currency: "LKR" });

        expect(response.status).toBe(200);
        expect(response.body.goal.currentAmount).toBe(100000);

        // **3️.Delete Goal**
        response = await request(app)
            .delete(`/goals/deleteGoal/${goalId}`)
            .set("Authorization", authToken);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Goal deleted successfully");
    });

    //Test Case: Ensure Unauthorized User Cannot Access Routes**
    it("Should return 403 when a request is made without a valid token", async () => {
        const response = await request(app)
            .get("/transaction/getUserTransactions");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Access denied.No token provided");
    });
});
