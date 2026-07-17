import { body, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const handleValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

export const employeeCreateValidation = [
  body("employeeId").trim().notEmpty().withMessage("Employee ID is required"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("designation").trim().notEmpty().withMessage("Designation is required"),
  body("salary")
    .isFloat({ min: 0 })
    .withMessage("Salary must be a positive number"),
  body("joiningDate").isISO8601().withMessage("Valid joining date is required"),
  body("role").optional().isIn(["super_admin", "hr_manager", "employee"]),
  body("status").optional().isIn(["active", "inactive"]),
  handleValidation,
];

export const employeeUpdateValidation = [
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Salary must be a positive number"),
  body("joiningDate")
    .optional()
    .isISO8601()
    .withMessage("Valid joining date is required"),
  body("role").optional().isIn(["super_admin", "hr_manager", "employee"]),
  body("status").optional().isIn(["active", "inactive"]),
  handleValidation,
];

export const listQueryValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  handleValidation,
];
