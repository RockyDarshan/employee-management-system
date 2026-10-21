export type Role = "super_admin" | "hr_manager" | "employee";
export type Status = "active" | "inactive";

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  role: Role;
  reportingManager:
    | { _id: string; name: string; employeeId: string; designation: string }
    | string
    | null;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  departments: string[];
  departmentBreakdown: { department: string; count: number }[];
}

export interface OrgNode extends Employee {
  children: OrgNode[];
}

export interface PaginatedEmployees {
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Employee[];
}
