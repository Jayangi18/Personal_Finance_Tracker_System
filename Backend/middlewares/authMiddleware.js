const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    if(!token) {
        console.log("No token provided");
        return res.status(401).json({message: "Access denied.No token provided"});
    }

    // Check if the token starts with "Bearer "
    if (!token.startsWith("Bearer ")) {
        return res.status(400).json({ message: "Invalid token format" });
    }

    // Extract the token (remove "Bearer " from the start)
    const tokenString = token.split(" ")[1];
    if (!tokenString) {
        return res.status(400).json({ message: "Token is missing" });
    }

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        console.log("Token decoded:", decoded);
        req.user = decoded;
        console.log("Token verified, user authenticated:", req.user); // Log user details
        next();
    } catch(error) {
        console.error("JWT verification failed:", error.stack);
        res.status(403).json({message: "Invalid token"});
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        console.log("User role:", req.user.role); // Log the user role

        if (!req.user) {
            return res.status(400).json({ message: "User not authenticated" });
        }
        
        if (req.user.role !== role) {
            console.log("Access denied: Insufficient role");
            return res.status(403).json({ message: "Access denied. Admin only" });
        }
        console.log("Role authorized");
        next();
    };
};

module.exports = {
    authenticateUser,
    authorizeRole
};