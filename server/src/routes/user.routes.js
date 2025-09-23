import { Router } from "express";
import { registerUser, loginUser, getUser, logoutUser, getUserReviews, viewOtherProfile, rateUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Register with avatar (handled by multer)
router.post("/register", upload.single("avatar"), registerUser);
router.get("/reviews", verifyJWT, getUserReviews)

// Login (JSON body only)
router.post("/login", loginUser);
router.get("/me", verifyJWT, getUser)
router.post("/logout", verifyJWT, logoutUser)

router.get("/:otherUserId", verifyJWT, viewOtherProfile)
router.post("/:otherUserId/rate", verifyJWT, rateUser)

export default router;
