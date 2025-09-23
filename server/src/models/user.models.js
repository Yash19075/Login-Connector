import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ratingSchema = new mongoose.Schema({
    rating : {
        type: Number,
        min : 1,
        max : 5,
        required: true
    },
    ratedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    }
    },
    {
        timestamps: true
    }
)

const userSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            required: true,
            unique: true,
        },
        email:{
            type: String,
            required: true,
            unique: true
        },
        fullName:{
            type: String,
            required: true
        },
        avatar: {
            type: String
        },
        role : {
            type: String,
            enum : ['buyer', "seller"],
            default: 'buyer'
        }, 
        password : {
            type: String, 
            required: true
        },
        refreshToken: {
            type: String
        },
        ratings : [ratingSchema]
    },
        {
        timestamps: true
    }
)

// ✅ FIXED: Added ! and () 
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    console.log("Hashing password for:", this.email); // Debug log
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Password hashed successfully"); // Debug log
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    console.log("Comparing passwords for:", this.email); // Debug log
    const result = await bcrypt.compare(password, this.password);
    console.log("Password comparison result:", result); // Debug log
    return result;
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,      
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);