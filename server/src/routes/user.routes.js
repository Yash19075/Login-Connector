import { Router } from "express";
import { registerUser, loginUser, getUser, logoutUser, getUserReviews, getReceivedReviews, viewOtherProfile, rateUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getUser);
router.get("/reviews", verifyJWT, getUserReviews);
router.get("/reviews/received", verifyJWT, getReceivedReviews);
router.get("/:otherUserId", verifyJWT, viewOtherProfile);
router.post("/:otherUserId/rate", verifyJWT, rateUser);

export default router;