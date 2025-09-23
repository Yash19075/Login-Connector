import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
  createItemOrder, 
  verifyItemPayment, 
  createOrder, 
  verifyPayment,
  getPaymentDetails,
  refundPayment,
  getRazorpayOrder,
  handleWebhook
} from "../controllers/razorpay.controller.js";

const router = Router();

// Item-specific payment routes (secured)
router.post("/items/:itemId/create-order", verifyJWT, createItemOrder);
router.post("/items/:itemId/verify-payment", verifyJWT, verifyItemPayment);

// Generic payment routes (secured)
router.post("/create-order", verifyJWT, createOrder);
router.post("/verify-payment", verifyJWT, verifyPayment);

// Payment utility routes (secured)
router.get("/payment/:paymentId", verifyJWT, getPaymentDetails);
router.post("/refund/:paymentId", verifyJWT, refundPayment);
router.get("/order/:orderId", verifyJWT, getRazorpayOrder);

// Webhook route (not secured - Razorpay needs direct access)
router.post("/webhook", handleWebhook);

router.get("/test", verifyJWT, (req, res) => {
  res.json({ message: "Razorpay routes working!", user: req.user?._id });
});

export default router;