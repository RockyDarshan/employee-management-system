import { Router } from "express";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDashboardStats,
  getOrgTree,
  getReportees,
  updateManager,
} from "../controllers/employeeController";
import { protect, authorize } from "../middleware/auth";
import {
  employeeCreateValidation,
  employeeUpdateValidation,
  idParamValidation,
  listQueryValidation,
} from "../middleware/validators";

const router = Router();

router.use(protect); // every route below requires a valid JWT

router.get("/dashboard/stats", getDashboardStats);
router.get("/organization/tree", getOrgTree);

router
  .route("/employees")
  .get(listQueryValidation, getEmployees)
  .post(
    authorize("super_admin", "hr_manager"),
    employeeCreateValidation,
    createEmployee,
  );

router
  .route("/employees/:id")
  .get(idParamValidation, getEmployee)
  .put(idParamValidation, employeeUpdateValidation, updateEmployee) // fine-grained checks done inside controller
  .delete(idParamValidation, authorize("super_admin"), deleteEmployee);

router.get("/employees/:id/reportees", idParamValidation, getReportees);
router.patch(
  "/employees/:id/manager",
  idParamValidation,
  authorize("super_admin", "hr_manager"),
  updateManager,
);

export default router;
