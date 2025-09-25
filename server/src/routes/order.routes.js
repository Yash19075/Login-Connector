import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMyBoughtOrders, getMySoldOrders } from "../controllers/order.controller.js";

const router = Router();

router.get("/my-bought-orders", verifyJWT, getMyBoughtOrders);
router.get("/my-sold-orders", verifyJWT, getMySoldOrders);

export default router