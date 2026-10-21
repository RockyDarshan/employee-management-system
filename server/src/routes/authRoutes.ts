import { Router } from "express";
import { login, logout, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { loginValidation } from "../middleware/validators";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", loginLimiter, loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
