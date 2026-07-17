import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import Employee, { IEmployee } from "../models/Employee";

export interface AuthRequest extends Request {
  user?: IEmployee;
}

// Verifies the JWT (from cookie or Authorization header) and attaches the user to req
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | undefined;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated. Please log in." });
    }

    const decoded = verifyToken(token);
    const user = await Employee.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

// Restricts a route to specific roles. Usage: authorize("super_admin", "hr_manager")
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action.`,
      });
    }
    next();
  };
};
