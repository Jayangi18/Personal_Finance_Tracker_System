const UserModel = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//user registration
const registerUser = async (req, res) => {
    try{
        console.log("Headers received:", req.headers); // Debug headers
        console.log("Register request received:", req.body); // Debug body

        let { userName, email, password, role} = req.body;

        // Ensure role is defined before calling toLowerCase()
        if (!role) {
            return res.status(400).json({ error: "Role is required. Allowed values: admin, user" });
        }

        // Convert role to lowercase to avoid case-sensitive issues
        role = role.toLowerCase();

        // Role validation (ensure only "admin" or "user")
        const validRoles = ["admin", "user"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified, admin,user" });
        }

        //check if user already exist
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            console.log("User already exist with email:", email);
            return res.status(400).json({error: "User already exists"});
        }

        // Hash the password before saving
        // const hashedPassword = await bcrypt.hash(password, 10);
        // console.log("Hashed Password Before Saving:", hashedPassword);

        //create and save new user
        const newUser = new UserModel({ 
            userName,
            email, 
            password, 
            role 
        });
        await newUser.save();

        console.log("User registered successfully:", newUser);
        res.status(201).json({ message: 'User registered successfully' });

    } catch(error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Internal server error during registration" });
    }
};

// User Login
const loginUser = async (req, res) => {
    try {
        console.log("Login request received:", req.body);

        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            console.log("Login failed: user not found with email:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("Entered password:", password);  //Log entered password
        console.log("Stored hashed password:", user.password);  //Log stored hash

        //compare entered password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        console.log("Password match status:", isMatch); //Log comparison result

        if (!isMatch) {
            console.log("Login failed: Incorrect password for user:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1w" }  // can change......
        );

        //console.log("Login Successful:", {id: user._id, userName: user.userName, role: user.role});
        res.status(200).json({ token, user: { id: user._id, userName: user.userName, role: user.role } });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error during Login" });
    }
};


module.exports = {
    registerUser,
    loginUser,
};

    