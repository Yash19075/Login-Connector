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
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
        // Missing payment-related fields that your controller uses
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
        },
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
        },
        razorpayPaymentId: {
            type: String,
            // Not required initially as it's set after payment verification
        },
        paymentCompletedAt: {
            type: Date,
            // Set when payment is verified
        },
        // Additional useful fields
        paymentMethod: {
            type: String,
            default: "razorpay",
        },
        refundId: {
            type: String,
            // For storing refund transaction ID if needed
        },
        notes: {
            type: String,
            // For any additional order notes
        }
    },
    {
        timestamps: true
    }
);

// Add indexes for better query performance
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
// orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ razorpayPaymentId: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
    return `Order ${this._id} - ${this.quantity}x item for ₹${this.totalAmount}`;
});

// Pre-save middleware to ensure totalAmount matches price * quantity
orderSchema.pre('save', function(next) {
    if (this.isModified('price') || this.isModified('quantity')) {
        this.totalAmount = this.price * this.quantity;
    }
    next();
});

export const Order = mongoose.model("Order", orderSchema);