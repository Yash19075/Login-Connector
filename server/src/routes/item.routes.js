import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createItem, getAllItems, sendMessage, allMessages, addReview, getAllReviews, updateReview, deleteReview, updateItem, getSingleItem, buyItem} from "../controllers/items.controller.js";

const router = Router();

// Item CRUD operations
router.post("/create-item", verifyJWT, upload.single("picture"), createItem)
router.get("/getallItems", verifyJWT, getAllItems)
router.get("/:itemId", verifyJWT, getSingleItem)
router.put("/:itemId/update", verifyJWT, upload.single("picture"), updateItem) // Fixed: PUT method and added multer for image upload

// Messaging endpoints
router.post("/:itemId/message", verifyJWT, sendMessage)
router.get("/:itemId/messages", verifyJWT, allMessages)

// Review endpoints
router.post("/:itemId/review", verifyJWT, addReview)
router.get("/:itemId/reviews", verifyJWT, getAllReviews)
router.put("/:itemId/review", verifyJWT, updateReview)
router.delete("/:itemId/review", verifyJWT, deleteReview)

router.post("/:itemId/buy", verifyJWT, buyItem)

export default router;