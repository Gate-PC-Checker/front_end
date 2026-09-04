import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth } from "@/lib/auth";
import { listUsers, listDevices, listGuestPasses } from "@/lib/backend";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Laptop,
  AlertCircle,
  TrendingUp,
  Download,
  Shield,
  Tag,
} from "lucide-react";

interface ReportData {
  totalEmployees: number;
  totalPCs: number;
  activePCs: number;
  replacedPCs: number;
  blockedPCs: number;
  registrationsThisMonth: number;
  reportsThisMonth: number;
  averagePCsPerStudent: number;
  departmentCode: string;
}

interface StudentPCCount {
  employeeName: string;
  employeeId: string;
  pcCount: number;
  status: string;
}

export default function DepartmentReports() {
  const navigate = useNavigate();
  const auth = getAuth("department");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [studentPCCounts, setStudentPCCounts] = useState<StudentPCCount[]>([]);
  const [guestPassList, setGuestPassList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }

    loadReportData();
  }, [auth, navigate]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [userResponse, deviceResponse, guestResponse] = await Promise.all([
        listUsers(),
        listDevices(),
        listGuestPasses().catch(() => []),
      ]);
      const users = Array.isArray(userResponse) ? userResponse : userResponse.results || [];
      const devices = Array.isArray(deviceResponse) ? deviceResponse : deviceResponse.results || [];
      const guestPasses = Array.isArray(guestResponse) ? guestResponse : guestResponse.results || [];
      const employees = users.filter((user: any) => user.role === "EMPLOYEE");

      const employeeRows = employees.map((user: any) => {
        const userDevices = devices.filter((device: any) => {
          const ownerId = typeof device.owner === "object" ? device.owner?.id : device.owner;
          return String(ownerId) === String(user.id);
        });

        const hasFlagged = userDevices.some((device: any) => device.status === "STOLEN");
        return {
          employeeName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
          employeeId: user.username || user.email || "N/A",
          pcCount: userDevices.length,
          status: hasFlagged ? "Flagged" : userDevices.length > 0 ? "Active" : "Pending",
        };
      });

      const flaggedGuests = guestPasses.filter((g: any) => g.status === "STOLEN_FLAG" || g.flagged_as_stolen);
      const totalFlagged = devices.filter((device: any) => device.status === "STOLEN").length + flaggedGuests.length;

      setReportData({
        totalEmployees: employees.length,
        totalPCs: devices.length + guestPasses.length,
        activePCs: devices.filter((device: any) => device.status !== "STOLEN").length,
        replacedPCs: devices.filter((device: any) => device.status === "DECOMMISSIONED").length,
        blockedPCs: totalFlagged,
        registrationsThisMonth: devices.length + guestPasses.length,
        reportsThisMonth: totalFlagged,
        averagePCsPerStudent: employees.length > 0 ? devices.length / employees.length : 0,
        departmentCode: auth.user.code,
      });

      setStudentPCCounts(employeeRows);
      setGuestPassList(guestPasses);
    } catch (error) {
      console.error("Failed to load report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  const handleDownloadReport = () => {
    alert("Report download feature coming soon!");
  };

  if (!auth) return null;

  if (isLoading) {
    return (
      <PortalLayout
        title="Reports"
        onLogout={handleLogout}
        showLogout={true}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Department Reports"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="space-y-8">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/dept/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Department Reports</h1>
            <p className="text-muted-foreground">
              Department: {reportData?.departmentCode}
            </p>
          </div>
          <Button className="gap-2 rounded-lg" onClick={handleDownloadReport}>
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        </div>

        {/* Key Metrics */}
        {reportData && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
                  <p className="text-3xl font-bold">{reportData.totalEmployees}</p>
                </div>
                <Users className="w-10 h-10 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total PCs</p>
                  <p className="text-3xl font-bold">{reportData.totalPCs}</p>
                </div>
                <Laptop className="w-10 h-10 text-secondary opacity-50" />
              </div>
            </Card>

            <Card className="p-6 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active PCs</p>
                  <p className="text-3xl font-bold text-green-600">
                    {reportData.activePCs}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg PCs/Employee</p>
                  <p className="text-3xl font-bold">
                    {reportData.averagePCsPerStudent.toFixed(2)}
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-accent opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* PC Status Breakdown */}
        {reportData && (
          <Card className="p-8 rounded-lg border-2">
            <h2 className="text-2xl font-bold mb-6">PC Status Breakdown</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-2">Active</p>
                <p className="text-4xl font-bold text-green-600">
                  {reportData.activePCs}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {reportData.totalPCs > 0 ? ((reportData.activePCs / reportData.totalPCs) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>

              <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-muted-foreground mb-2">Replaced</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {reportData.replacedPCs}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {reportData.totalPCs > 0 ? ((reportData.replacedPCs / reportData.totalPCs) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>

              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-muted-foreground mb-2">Blocked</p>
                <p className="text-4xl font-bold text-red-600">
                  {reportData.blockedPCs}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {reportData.totalPCs > 0 ? ((reportData.blockedPCs / reportData.totalPCs) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {reportData && (
          <Card className="p-8 rounded-lg border-2">
            <h2 className="text-2xl font-bold mb-6">This Month Summary</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">New Registrations</p>
                <p className="text-3xl font-bold">
                  {reportData.registrationsThisMonth}
                </p>
              </div>
              <div className="p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Lost/Damaged Reports</p>
                <p className="text-3xl font-bold text-red-600">
                  {reportData.reportsThisMonth}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Student PC Registration Status */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Employee PC Registration Status</h2>
          <Card className="rounded-lg border-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-card">
                  <tr>
                    <th className="text-left p-4 font-semibold">Employee Name</th>
                    <th className="text-left p-4 font-semibold">Employee ID</th>
                    <th className="text-left p-4 font-semibold">PCs Registered</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPCCounts.map((student, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 font-medium">{student.employeeName}</td>
                      <td className="p-4 font-mono text-sm">{student.employeeId}</td>
                      <td className="p-4">
                        <span className="font-bold text-lg">{student.pcCount}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : student.status === "Flagged"
                                ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
