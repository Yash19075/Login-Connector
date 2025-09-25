import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    sendPrivateMessage, 
    getPrivateMessages, 
    getChatParticipants,
    getAllPrivateChats,
    deletePrivateChat 
} from "../controllers/chat.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/:itemId/private-message/:otherUserId", sendPrivateMessage);
router.get("/:itemId/private-messages/:otherUserId", getPrivateMessages);
router.get("/:itemId/participants", getChatParticipants);
router.get("/all-chats", getAllPrivateChats);
router.delete("/:itemId/private-chat/:otherUserId", deletePrivateChat);

export default router;