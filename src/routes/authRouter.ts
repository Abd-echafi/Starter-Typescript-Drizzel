import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  protect,
  restrictTo,
} from "../controllers/authController";
const router = Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/verify-email/:token").post(verifyEmail);
router.route("/test").get(protect, restrictTo("admin"), (req, res, next) => {
  console.log("request.user: ", req.user);
});

export default router;
