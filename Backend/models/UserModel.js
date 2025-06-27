const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // Normalize email
        match: [/\S+@\S+\.\S+/, "Invalid email format"], // Basic email validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    }
},
{timestamps: true}
);

//hash password before saving
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const UserModel = mongoose.model("User", userSchema);
//export model
module.exports = UserModel;

