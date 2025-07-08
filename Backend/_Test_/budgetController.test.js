jest.setTimeout(150000);

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const BudgetModel = require("../models/BudgetModel");
const UserModel = require("../models/UserModel");

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    console.log("✅ Test Database Connected");

    // Create test user
    testUser = new UserModel({
        userName: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        role: "user",
    });
    await testUser.save();

    // Generate valid JWT token
    authToken = `Bearer ${jwt.sign(
        { userId: testUser._id, role: testUser.role },
        process.env.JWT_SECRET, // Ensure JWT_SECRET is in `.env.test`
        { expiresIn: "1h" }
    )}`;
    console.log("Test JWT Token:", authToken);
});

beforeEach(async () => {
    await BudgetModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Test Database Disconnected");
});

// Test Cases
describe("Budget Controller Tests", () => {
    //Test - setBudget
    it("Should set a new budget", async () => {
        const newBudget = {
            category: "Food",
            amount: 10000,
            amountInLKR: 10000, //Ensure amountInLKR is included
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            currency: "LKR"
        };

        const response = await request(app)
            .post("/budget/setBudget")
            .send(newBudget)
            .set("Authorization", authToken)
            .expect(201);

        expect(response.body.message).toBe("Budget set successfully");
        expect(response.body.newBudget.amount).toBe(10000);
    });

    //Test - getUserBudgets 
    it("Should fetch user budgets", async () => {
        const response = await request(app)
            .get("/budget/getUserBudgets")
            .set("Authorization", authToken)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    //Test - updateBudgetAmount
    it("Should update budget amount", async () => {
        // Step 1: Create a test budget
        const budget = new BudgetModel({
            userId: testUser._id,
            category: "Travel",
            amount: 15000,
            amountInLKR: 15000, // Ensure amountInLKR is included
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            currency: "LKR"
        });
        await budget.save();

        // Step 2: Send a PUT request to update the budget amount
        const updatedAmount = 20000; // New amount
        const response = await request(app)
            .put(`/budget/updateBudgetAmount/${budget._id}`)
            .send({ amount: updatedAmount, currency: "LKR" }) // Ensure currency is sent
            .set("Authorization", authToken)
            .expect(200);

        // Step 3: Check the response
        expect(response.body.message).toBe("Budget amount updated successfully");
        expect(response.body.updatedBudget.amount).toBe(updatedAmount);
    });

    //Test - deleteBudget
    it("Should delete a budget", async () => {
        const budget = new BudgetModel({
            userId: testUser._id,
            category: "Entertainment",
            amount: 5000,
            amountInLKR: 5000, //Ensure amountInLKR is included
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            currency: "LKR"
        });
        await budget.save();

        const response = await request(app)
            .delete(`/budget/deleteBudget/${budget._id}`)
            .set("Authorization", authToken)
            .expect(200);

        expect(response.body.message).toBe("Budget deleted successfully");
    });
});
