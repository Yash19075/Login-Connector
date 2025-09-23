import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
    {
        item: {
            type: mongoose.Schema.ObjectId,
            ref: "Item",
            required: true
        },
        buyer: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true
        },
        seller: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true
        },
        quantity: {
        type: Number,
        required: true,
        min: 1,
        },
        price: {
        type: Number,
        required: true,
        },
        totalAmount: {
        type: Number,
        required: true,
        },
        status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
        },
    },
    {
        timestamps: true
    }
);

export const Order = mongoose.model("Order", orderSchema);