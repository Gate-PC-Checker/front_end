export type UserRole = "student" | "department";

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  photo?: string;
}

export interface Department {
  id: string;
  name: string;
  headName: string;
  email: string;
  phone: string;
}

export interface PC {
  id: string;
  serialNumber: string;
  model: string;
  brand: string;
  purchaseDate: string;
  studentId: string;
  qrCode: string;
  qrImage?: string;
  status: "active" | "blocked" | "replaced";
  rawStatus?: string;
  createdAt: string;
}

export interface PCHistory {
  id: string;
  pcId: string;
  studentId: string;
  action: "registered" | "changed" | "reported" | "scanned";
  timestamp: string;
  details?: string;
}

// Simulated auth storage
export function storeAuth(role: UserRole, token: string, userData: any) {
  sessionStorage.setItem(`auth_${role}`, JSON.stringify({ token, user: userData }));
}

export function getAuth(role: UserRole) {
  const data = sessionStorage.getItem(`auth_${role}`);
  return data ? JSON.parse(data) : null;
}

export function clearAuth(role: UserRole) {
  sessionStorage.removeItem(`auth_${role}`);
}

export function isAuthenticated(role: UserRole): boolean {
  return !!getAuth(role);
}
