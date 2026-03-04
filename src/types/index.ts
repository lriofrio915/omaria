// OmarIA - Type definitions

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

export interface EmployeeWithRelations {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: string;
  contractType: string;
  hireDate: Date;
  salary?: number | null;
  avatarUrl?: string | null;
  department: { id: string; name: string };
  position: { id: string; title: string };
  manager?: { id: string; firstName: string; lastName: string } | null;
}

export interface DocumentWithRelations {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  tags: string[];
  version: number;
  employee?: { id: string; firstName: string; lastName: string } | null;
  position?: { id: string; title: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollWithEmployee {
  id: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate?: Date | null;
  grossSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  status: string;
  receiptUrl?: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDocuments: number;
  pendingPayrolls: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
