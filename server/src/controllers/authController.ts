import { Request, Response } from "express";
import Employee from "../models/Employee";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

const cookieOptions = () => {
  const days = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 1);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  };
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const user = await Employee.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Account is inactive. Contact admin.",
        });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });

    res.cookie("token", token, cookieOptions());

    const userSafe = user.toObject();
    delete (userSafe as any).password;

    return res.status(200).json({ success: true, token, user: userSafe });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  return res.status(200).json({ success: true, user: req.user });
};
