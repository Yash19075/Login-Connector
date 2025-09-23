import { razorpay } from "../utils/razorpay.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Item } from "../models/items.models.js";
import { Order } from "../models/order.model.js";
import crypto from "crypto";

// Create Razorpay order for item purchase
// Enhanced createItemOrder with better debugging
export const createItemOrder = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    console.log("=== CREATE ORDER START ===");
    console.log("Creating order for:", { 
      itemId, 
      quantity, 
      userId: userId.toString(),
      userIdType: typeof userId 
    });

    // Validate required fields
    if (!quantity || quantity <= 0) {
      throw new ApiError(400, "Valid quantity is required");
    }

    // Validate item exists and is available
    const item = await Item.findById(itemId).populate('postedBy');
    if (!item) {
      throw new ApiError(404, "Item not found");
    }

    console.log("Found item:", { 
      id: item._id.toString(), 
      name: item.name, 
      quantity: item.quantity, 
      status: item.status,
      postedBy: item.postedBy._id.toString()
    });

    if (item.quantity < quantity) {
      throw new ApiError(400, `Insufficient item quantity. Available: ${item.quantity}, Requested: ${quantity}`);
    }

    if (item.status !== "in-stock") {
      throw new ApiError(400, `Item is not available for purchase. Status: ${item.status}`);
    }

    // Prevent users from buying their own items
    if (item.postedBy._id.toString() === userId.toString()) {
      throw new ApiError(400, "Cannot purchase your own item");
    }

    const amount = item.price * quantity;
    const receipt = `item_${Date.now()}`;

    const options = {
      amount: Math.round(amount * 100), // amount in paise, ensure it's an integer
      currency: "INR",
      receipt,
      notes: {
        item_id: itemId.toString(),
        quantity: quantity.toString(),
        user_id: userId.toString(),
        item_name: item.name,
      }
    };

    console.log("Creating Razorpay order with options:", options);

    const razorpayOrder = await razorpay.orders.create(options);

    if (!razorpayOrder) {
      throw new ApiError(500, "Failed to create Razorpay order");
    }

    console.log("Razorpay order created:", {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status
    });

    // Create pending order in database
    console.log("=== CREATING DATABASE ORDER ===");
    const orderData = {
      item: itemId,
      buyer: userId,
      seller: item.postedBy._id,
      quantity: parseInt(quantity), // Ensure it's a number
      price: item.price,
      totalAmount: amount,
      status: "pending",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
    };

    console.log("Order data to be saved:", orderData);

    const pendingOrder = await Order.create(orderData);

    console.log("Database order created successfully:", {
      orderId: pendingOrder._id.toString(),
      buyer: pendingOrder.buyer.toString(),
      seller: pendingOrder.seller.toString(),
      razorpayOrderId: pendingOrder.razorpayOrderId,
      status: pendingOrder.status,
      paymentStatus: pendingOrder.paymentStatus
    });

    // Verify the order was actually saved
    const verifyOrder = await Order.findById(pendingOrder._id);
    if (!verifyOrder) {
      console.log("ERROR: Order was not saved to database!");
      throw new ApiError(500, "Failed to save order to database");
    }

    console.log("Order verification successful:", {
      found: !!verifyOrder,
      id: verifyOrder._id.toString()
    });

    return res.status(200).json(
      new ApiResponse(
        200, 
        {
          ...razorpayOrder,
          orderId: pendingOrder._id,
          itemName: item.name,
          itemPrice: item.price,
          totalAmount: amount,
          // Include these for debugging
          debugInfo: {
            userId: userId.toString(),
            razorpayOrderId: razorpayOrder.id,
            databaseOrderId: pendingOrder._id.toString()
          }
        }, 
        "Order created successfully"
      )
    );
  } catch (error) {
    console.error("=== CREATE ORDER ERROR ===");
    console.error("Error in createItemOrder:", error);
    
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle Razorpay specific errors
    if (error.error && error.error.description) {
      throw new ApiError(400, `Razorpay Error: ${error.error.description}`);
    }
    
    // Generic error
    throw new ApiError(500, `Failed to create order: ${error.message}`);
  }
});

// Enhanced verification with comprehensive order lookup
export const verifyItemPayment = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      quantity 
    } = req.body;
    const userId = req.user._id;

    console.log("=== PAYMENT VERIFICATION START ===");
    console.log("Verification request:", { 
      itemId, 
      razorpay_order_id, 
      razorpay_payment_id,
      quantity,
      userId: userId.toString(),
      userIdType: typeof userId
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Missing required payment verification fields");
    }

    // First, let's see all orders in the database for debugging
    console.log("=== DEBUGGING: ALL ORDERS FOR USER ===");
    const userOrders = await Order.find({ buyer: userId }).select('_id razorpayOrderId status paymentStatus createdAt');
    console.log("User's orders:", userOrders.map(o => ({
      id: o._id.toString(),
      razorpayOrderId: o.razorpayOrderId,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt
    })));

    // Try to find order with more flexible criteria
    console.log("=== SEARCHING FOR ORDER ===");
    
    // Method 1: Exact match
    let order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      buyer: userId
    }).populate('item seller');

    console.log("Method 1 (exact match) result:", !!order);

    if (!order) {
      // Method 2: Find by Razorpay order ID only
      console.log("Trying Method 2: Find by razorpayOrderId only");
      const orderByRazorpayId = await Order.findOne({
        razorpayOrderId: razorpay_order_id
      }).populate('item seller buyer');

      if (orderByRazorpayId) {
        console.log("Found order by razorpayOrderId:", {
          orderId: orderByRazorpayId._id.toString(),
          buyer: orderByRazorpayId.buyer._id.toString(),
          expectedBuyer: userId.toString(),
          buyerMatch: orderByRazorpayId.buyer._id.toString() === userId.toString(),
          item: orderByRazorpayId.item._id.toString(),
          expectedItem: itemId
        });

        // Check if it's just a buyer mismatch
        if (orderByRazorpayId.buyer._id.toString() === userId.toString()) {
          order = orderByRazorpayId;
          console.log("Order found with Method 2");
        } else {
          console.log("ERROR: Order found but buyer ID doesn't match");
          throw new ApiError(403, "Order does not belong to the current user");
        }
      }
    }

    if (!order) {
      // Method 3: Check recent orders
      console.log("Trying Method 3: Recent orders check");
      const recentOrders = await Order.find({
        buyer: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      }).populate('item seller');

      console.log("Recent orders found:", recentOrders.length);
      recentOrders.forEach((o, index) => {
        console.log(`Recent order ${index + 1}:`, {
          id: o._id.toString(),
          razorpayOrderId: o.razorpayOrderId,
          item: o.item._id.toString(),
          status: o.status,
          paymentStatus: o.paymentStatus
        });
      });

      throw new ApiError(404, "Order not found. Please check if the order was created successfully.");
    }

    console.log("Order found:", {
      id: order._id.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      razorpayOrderId: order.razorpayOrderId
    });

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      throw new ApiError(400, "Invalid signature, payment not verified");
    }

    // Check if already processed
    if (order.paymentStatus === "completed") {
      console.log("Payment already processed, returning existing order");
      const existingOrder = await Order.findById(order._id)
        .populate('item', 'name picture price')
        .populate('seller', 'fullName username email')
        .populate('buyer', 'fullName username email');

      return res.status(200).json(
        new ApiResponse(200, existingOrder, "Payment already processed")
      );
    }

    // Update order
    order.paymentStatus = "completed";
    order.status = "confirmed";
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentCompletedAt = new Date();
    await order.save();

    // Update item quantity
    const item = await Item.findById(itemId);
    if (item) {
      const quantityToReduce = quantity || order.quantity;
      item.quantity = Math.max(0, item.quantity - quantityToReduce);
      if (item.quantity <= 0) {
        item.status = "out-of-stock";
        item.quantity = 0;
      }
      await item.save();
    }

    // Return complete order details
    const completeOrder = await Order.findById(order._id)
      .populate('item', 'name picture price')
      .populate('seller', 'fullName username email')
      .populate('buyer', 'fullName username email');

    return res.status(200).json(
      new ApiResponse(200, completeOrder, "Payment verified and order completed successfully")
    );

  } catch (error) {
    console.error("=== PAYMENT VERIFICATION ERROR ===");
    console.error("Error:", error.message);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, `Payment verification failed: ${error.message}`);
  }
});

// Generic create order (for other purposes)
export const createOrder = asyncHandler(async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "receipt#1", notes = {} } = req.body;

    if (!amount || amount <= 0) {
      throw new ApiError(400, "Valid amount is required");
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      throw new ApiError(500, "Failed to create Razorpay order");
    }

    return res.status(200).json(
      new ApiResponse(200, order, "Order created successfully")
    );
  } catch (error) {
    console.error("Error in createOrder:", error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.error && error.error.description) {
      throw new ApiError(400, `Razorpay Error: ${error.error.description}`);
    }
    
    throw new ApiError(500, `Failed to create order: ${error.message}`);
  }
});

// Generic verify payment
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Missing required payment verification fields");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      throw new ApiError(400, "Invalid signature, payment not verified");
    }

    return res.status(200).json(
      new ApiResponse(
        200, 
        { 
          razorpay_order_id, 
          razorpay_payment_id,
          verified: true 
        }, 
        "Payment verified successfully"
      )
    );
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, `Payment verification failed: ${error.message}`);
  }
});

// Get payment details
export const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(400, "Payment ID is required");
    }

    const payment = await razorpay.payments.fetch(paymentId);
    
    return res.status(200).json(
      new ApiResponse(200, payment, "Payment details retrieved successfully")
    );
  } catch (error) {
    console.error("Error in getPaymentDetails:", error);
    
    if (error.statusCode === 400 && error.error && error.error.description) {
      throw new ApiError(404, "Payment not found or invalid payment ID");
    }
    
    throw new ApiError(500, `Failed to fetch payment details: ${error.message}`);
  }
});

// Refund payment
export const refundPayment = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason = "requested_by_customer" } = req.body;

    if (!paymentId) {
      throw new ApiError(400, "Payment ID is required");
    }

    const refundData = {
      notes: {
        reason,
        refunded_by: req.user._id.toString(),
        refunded_at: new Date().toISOString(),
      }
    };

    // Add amount if specified (for partial refunds)
    if (amount && amount > 0) {
      refundData.amount = Math.round(amount * 100); // amount in paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);

    return res.status(200).json(
      new ApiResponse(200, refund, "Refund initiated successfully")
    );
  } catch (error) {
    console.error("Error in refundPayment:", error);
    
    if (error.error && error.error.description) {
      throw new ApiError(400, `Refund Error: ${error.error.description}`);
    }
    
    throw new ApiError(500, `Failed to process refund: ${error.message}`);
  }
});

// Get order details from Razorpay
export const getRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await razorpay.orders.fetch(orderId);
    
    return res.status(200).json(
      new ApiResponse(200, order, "Order details retrieved successfully")
    );
  } catch (error) {
    console.error("Error in getRazorpayOrder:", error);
    
    if (error.statusCode === 400 && error.error && error.error.description) {
      throw new ApiError(404, "Order not found or invalid order ID");
    }
    
    throw new ApiError(500, `Failed to fetch order details: ${error.message}`);
  }
});

// Handle webhook for payment status updates
export const handleWebhook = asyncHandler(async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn("RAZORPAY_WEBHOOK_SECRET not configured");
      return res.status(200).json({ status: 'ok' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error("Invalid webhook signature");
      throw new ApiError(400, "Invalid webhook signature");
    }

    const event = req.body;
    console.log("Webhook received:", event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity);
        // You can add database updates here
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity);
        // Handle failed payment - update order status, notify user, etc.
        break;
      
      case 'order.paid':
        console.log('Order paid:', event.payload.order.entity);
        // Handle order completion
        break;
      
      case 'payment.dispute.created':
        console.log('Dispute created:', event.payload.payment.entity);
        // Handle dispute
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error("Error in handleWebhook:", error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // For webhooks, we should return 200 even on errors to prevent retries
    console.error("Webhook processing failed:", error.message);
    return res.status(200).json({ status: 'error', message: error.message });
  }
});