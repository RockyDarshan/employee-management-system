import { Response } from "express";
import Employee from "../models/Employee";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pick = (obj: Record<string, any>, keys: string[]) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const CREATE_FIELDS = [
  "employeeId",
  "name",
  "email",
  "password",
  "phone",
  "department",
  "designation",
  "salary",
  "joiningDate",
  "role",
  "status",
  "reportingManager",
  "profileImage",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter(
  (f) => f !== "password" && f !== "employeeId",
);

// GET /api/employees?search=&department=&role=&status=&sortBy=&order=&page=&limit=
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const search = str(req.query.search)?.trim().slice(0, 100);
    const department = str(req.query.department);
    const role = str(req.query.role);
    const status = str(req.query.status);
    const sortBy = str(req.query.sortBy) ?? "joiningDate";
    const order = str(req.query.order) ?? "desc";
    const page = str(req.query.page) ?? "1";
    const limit = str(req.query.limit) ?? "10";

    const filter: any = {};

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Employees only ever see themselves via this endpoint
    if (req.user?.role === "employee") {
      filter._id = req.user._id;
    }

    const allowedSort = ["joiningDate", "name", "salary"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "joiningDate";
    const sortOrder = order === "asc" ? 1 : -1;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate("reportingManager", "name employeeId designation")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Employee.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: employees,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch employees." });
  }
};

// GET /api/employees/:id
export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    if (
      req.user?.role === "employee" &&
      req.params.id !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile.",
      });
    }

    const employee = await Employee.findById(req.params.id).populate(
      "reportingManager",
      "name employeeId designation",
    );
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }
    return res.status(200).json({ success: true, data: employee });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch employee." });
  }
};

// POST /api/employees  (super_admin, hr_manager only)
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body, CREATE_FIELDS };

    // Only super_admin may create another super_admin
    if (body.role === "super_admin" && req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can assign the Super Admin role.",
      });
    }

    if (body.reportingManager) {
      const managerExists = await Employee.findById(body.reportingManager);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Reporting manager does not exist.",
        });
      }
    }

    const employee = await Employee.create(body);
    const safe = employee.toObject();
    delete (safe as any).password;

    return res.status(201).json({ success: true, data: safe });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create employee." });
  }
};

// PUT /api/employees/:id
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isSelf = req.user?._id.toString() === id;
    let updates: Record<string, any> = pick(req.body, UPDATE_FIELDS);
    if (req.user?.role === "employee") {
      if (!isSelf) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own profile.",
        });
      }
      // Employees may only edit a limited whitelist of fields on themselves
      const allowedFields = ["phone", "profileImage"];
      updates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key)),
      );
    }

    if (req.user?.role === "hr_manager") {
      if (updates.role === "super_admin") {
        return res.status(403).json({
          success: false,
          message: "HR Manager cannot assign Super Admin role.",
        });
      }
      if (!isSelf) {
        const target = await Employee.findById(id).select("role");
        if (target?.role === "super_admin") {
          return res.status(403).json({
            success: false,
            message: "HR Manager cannot modify a Super Admin.",
          });
        }
      }
    }

    if (updates.reportingManager) {
      if (updates.reportingManager === id) {
        return res.status(400).json({
          success: false,
          message: "An employee cannot report to themselves.",
        });
      }
      const isCircular = await wouldCreateCircularReporting(
        id,
        updates.reportingManager,
      );
      if (isCircular) {
        return res.status(400).json({
          success: false,
          message:
            "This assignment would create a circular reporting structure.",
        });
      }
    }

    // Password updates go through a dedicated flow in a full build; block here for safety
    delete updates.password;

    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }

    return res.status(200).json({ success: true, data: employee });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update employee." });
  }
};

// DELETE /api/employees/:id  (super_admin only) - soft delete
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const employee = await Employee.findById(id).select("reportingManager");
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }

    // Move this employee's direct reports up to their own manager
    // (or make them top-level if there is none).
    const moved = await Employee.updateMany(
      { reportingManager: id },
      { reportingManager: employee.reportingManager ?? null },
    );

    await Employee.findByIdAndUpdate(id, {
      isDeleted: true,
      status: "inactive",
    });

    return res.status(200).json({
      success: true,
      message: "Employee deleted.",
      reassignedReportees: moved.modifiedCount,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete employee." });
  }
};

// GET /api/dashboard/stats
export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [total, active, inactive, byDept] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ status: "active" }),
      Employee.countDocuments({ status: "inactive" }),
      Employee.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const departmentBreakdown = byDept.map((d) => ({
      department: d._id as string,
      count: d.count as number,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees: total,
        activeEmployees: active,
        inactiveEmployees: inactive,
        departmentCount: departmentBreakdown.length,
        departments: departmentBreakdown.map((d) => d.department),
        departmentBreakdown,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard stats." });
  }
};

// GET /api/organization/tree
export const getOrgTree = async (_req: AuthRequest, res: Response) => {
  try {
    const all = await Employee.find(
      {},
      "name employeeId designation department reportingManager",
    );

    const byId: Record<string, any> = {};
    all.forEach((emp) => {
      byId[emp._id.toString()] = { ...emp.toObject(), children: [] };
    });

    const roots: any[] = [];
    all.forEach((emp) => {
      const node = byId[emp._id.toString()];
      if (emp.reportingManager && byId[emp.reportingManager.toString()]) {
        byId[emp.reportingManager.toString()].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return res.status(200).json({ success: true, data: roots });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to build organization tree." });
  }
};

// GET /api/employees/:id/reportees
export const getReportees = async (req: AuthRequest, res: Response) => {
  try {
    const reportees = await Employee.find({
      reportingManager: req.params.id,
    }).select("name employeeId designation department status");
    return res
      .status(200)
      .json({ success: true, count: reportees.length, data: reportees });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch reportees." });
  }
};

// PATCH /api/employees/:id/manager
export const updateManager = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    if (managerId) {
      if (managerId === id) {
        return res.status(400).json({
          success: false,
          message: "An employee cannot report to themselves.",
        });
      }
      const managerExists = await Employee.findById(managerId);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Reporting manager does not exist.",
        });
      }
      const isCircular = await wouldCreateCircularReporting(id, managerId);
      if (isCircular) {
        return res.status(400).json({
          success: false,
          message:
            "This assignment would create a circular reporting structure.",
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { reportingManager: managerId || null },
      { new: true },
    ).populate("reportingManager", "name employeeId designation");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found." });
    }

    return res.status(200).json({ success: true, data: employee });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update reporting manager." });
  }
};

// Walk up the proposed manager's chain; if we hit the employee being reassigned, it's circular.
async function wouldCreateCircularReporting(
  employeeId: string,
  proposedManagerId: string,
): Promise<boolean> {
  let currentId: string | null = proposedManagerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === employeeId) return true;
    if (visited.has(currentId)) break; // pre-existing loop safety net
    visited.add(currentId);

    const current: { reportingManager: mongoose.Types.ObjectId | null } | null =
      await Employee.findById(currentId).select("reportingManager");
    if (!current || !current.reportingManager) break;
    currentId = current.reportingManager.toString();
  }
  return false;
}
