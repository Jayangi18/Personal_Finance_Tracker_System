jest.setTimeout(150000); // Increase timeout for MongoDB Memory Server

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../server");
const GoalModel = require("../models/GoalModel");
const jwt = require("jsonwebtoken");

let mongoServer;
let authToken;
let testUserId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("Test Database Connected");

    // Create a test user
    testUserId = new mongoose.Types.ObjectId();
    authToken = `Bearer ${jwt.sign({ userId: testUserId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" })}`;

    console.log("Test JWT Token:", authToken);
});

beforeEach(async () => {
    await GoalModel.deleteMany(); // Clear database before each test
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Test Database Disconnected");
});

// Test Case: Create a New Goal
describe("Goal Controller Tests", () => {
    it("Should create a new goal", async () => {
        const newGoal = {
            title: "Buy a Laptop",
            targetAmount: 150000,
            deadline: "2025-12-31",
            autoSavePercentage: 10,
            currency: "LKR"
        };

        const response = await request(app)
            .post("/goals/createGoal")
            .set("Authorization", authToken)
            .send(newGoal);

        expect(response.status).toBe(201);
        expect(response.body.newGoal).toHaveProperty("_id");
        expect(response.body.newGoal.title).toBe("Buy a Laptop");
    });

    // Test Case: Get User Goals
    it("Should fetch user goals", async () => {
        await GoalModel.create({
            userId: testUserId,
            title: "Save for Car",
            targetAmount: 500000,
            deadline: "2026-01-01",
            autoSavePercentage: 15,
            currency: "LKR"
        });

        const response = await request(app)
            .get("/goals/getUserGoals")
            .set("Authorization", authToken);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    //Test Case: Update Goal Progress
    it("Should update goal progress", async () => {
        const goal = await GoalModel.create({
            userId: testUserId,
            title: "Emergency Fund",
            targetAmount: 100000,
            deadline: "2025-06-30",
            currentAmount: 20000,
            currency: "LKR"
        });

        const response = await request(app)
            .put(`/goals/updateGoalProgress/${goal._id}`)
            .set("Authorization", authToken)
            .send({ amount: 10000, currency: "LKR" });

        expect(response.status).toBe(200);
        expect(response.body.goal.currentAmount).toBe(30000);
    });

    //Test Case: Delete a Goal
    it("Should delete a goal", async () => {
        const goal = await GoalModel.create({
            userId: testUserId,
            title: "Vacation Fund",
            targetAmount: 200000,
            deadline: "2025-08-15",
            currency: "LKR"
        });

        const response = await request(app)
            .delete(`/goals/deleteGoal/${goal._id}`)
            .set("Authorization", authToken);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Goal deleted successfully");
    });
});
