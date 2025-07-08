jest.setTimeout(150000); // Increase test timeout

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const TransactionModel = require("../models/TransactionModel");
const UserModel = require("../models/UserModel");

let mongoServer;
let testUser;
let testToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("Test Database Connected");

    //Create a test user in the database
    testUser = await UserModel.create({
        userName: "testuser",
        email: "test@example.com",
        password: "hashedpassword", // Normally, you'd hash the password
        role: "user"
    });

    //Generate a valid JWT token using the secret from .env
    testToken = jwt.sign(
        { userId: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,  
        { expiresIn: "1h" }
    );

    console.log("Test User Created:", testUser);
    console.log("Test JWT Token Generated:", testToken);
});

//Clear database before each test
beforeEach(async () => {
    await TransactionModel.deleteMany({});
});

//Proper cleanup after all tests
afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }

    if (mongoServer) {
        await mongoServer.stop();
    }

    console.log("Test Database Disconnected");
});

//Test case: Add a new transaction
describe("Transaction Controller Tests", () => {
    it("Should add a new transaction", async () => {
        const newTransaction = {
            transactionType: "expense",
            category: "Food",
            amount: 5000,
            currency: "LKR",
            description: "Dinner",
            tags: ["restaurant"],
            isRecurring: false
        };

        const response = await request(app)
            .post("/transaction/addTransaction")
            .send(newTransaction)
            .set("Authorization", `Bearer ${testToken}`)  // Use generated token
            .expect(201);

        expect(response.status).toBe(201);
        expect(response.body.transaction).toHaveProperty("_id");
        expect(response.body.transaction.amount).toBe(5000);
    });

    // ✅ Test case: Get transactions
    it("Should fetch user transactions", async () => {
        // Add a test transaction first
        await TransactionModel.create({
            userId: testUser._id,
            transactionType: "expense",
            category: "Food",
            amount: 5000,
            currency: "LKR",
            exchangeRateToLKR: 1, // Assume 1:1 conversion for test
            amountInLKR: 5000,  //Must include this field
            description: "Dinner",
            tags: ["restaurant"],
            isRecurring: false
        });

        const response = await request(app)
            .get("/transaction/getUserTransactions")
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    //Test case: Update a transaction
    it("Should update a transaction", async () => {
        const transaction = await TransactionModel.create({
            userId: testUser._id,
            transactionType: "expense",
            category: "Shopping",
            amount: 1000,
            currency: "LKR",
            exchangeRateToLKR: 1, // Assume 1:1 conversion
            amountInLKR: 1000
        });

        const response = await request(app)
            .put(`/transaction/updateTransaction/${transaction._id}`)
            .send({ amount: 2000, amountInLKR: 2000 })
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.updatedTransaction.amount).toBe(2000);
    });

    // Test case: Delete a transaction
    it("Should delete a transaction", async () => {
        const transaction = await TransactionModel.create({
            userId: testUser._id,
            transactionType: "expense",
            category: "Bills",
            amount: 1500,
            currency: "LKR",
            exchangeRateToLKR: 1,
            amountInLKR: 1500, //Must include this field
        });

        const response = await request(app)
            .delete(`/transaction/deleteTransaction/${transaction._id}`)
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Transaction deleted successfully");

        // Check if transaction is actually deleted
        const deletedTransaction = await TransactionModel.findById(transaction._id);
        expect(deletedTransaction).toBeNull();
    });
});
