const express = require("express");
const {authenticateUser, authorizeRole} = require("../middlewares/authMiddleware");
const {getAllUsers, deleteUser, updateUserDetails, getDashboardData } = require("../controllers/userController");
//
//const UserModel = require("../models/UserModel");



const router = express.Router();

router.get("/users", authenticateUser, authorizeRole("admin"), getAllUsers);
router.delete("/users/:userId", authenticateUser, authorizeRole("admin"), deleteUser);
router.put("/users/:userId", authenticateUser, authorizeRole("admin"), updateUserDetails);
router.get("/dashboard", authenticateUser, getDashboardData);

//to user
router.put("/profile/:userId", authenticateUser, updateUserDetails);


///////jjcheck
// router.get("/users", authenticateUser, authorizeRole("admin"), async (req, res) => {
//     console.log("Request reached the route"); // Log that the route was reached

//     try {
//         const users = await UserModel.find({}, "-password"); // exclude password
//         console.log("Users fetched:", users); // Log fetched users
//         res.status(200).json(users);
//     } catch (error) {
//         console.error("Error fetching users:", error); // Log any errors
//         res.status(500).json({ message: "Error fetching users", error });
//     }
// });


/////not needed
// router.get("/check-user/:email", async (req, res) => {
//     try {
//         console.log("Received request for email:", req.params.email);

//         // Fetch user from database
//         const user = await UserModel.findOne({ email: req.params.email });

//         // If no user is found
//         if (!user) {
//             console.log("User not found:", req.params.email);
//             return res.status(404).json({ message: "User not found" });
//         }

//         console.log("User found:", user);
//         res.status(200).json(user);

//     } catch (error) {
//         console.error("Database error:", error);
//         res.status(500).json({ message: "Error retrieving user data", error: error.message });
//     }
// });

module.exports = router;
