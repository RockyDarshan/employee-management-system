import { Router } from "express";
import { login, logout, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { loginValidation } from "../middleware/validators";

const router = Router();

router.post("/login", loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
