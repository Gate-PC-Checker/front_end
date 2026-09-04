import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, Student } from "@/lib/auth";
import { listUsers, listDevices, normalizeImageUrl } from "@/lib/backend";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Laptop,
  AlertCircle,
  Trash2,
  Edit,
  Calendar,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface RegisteredPC {
  id: string;
  serialNumber: string;
  model: string;
  brand: string;
  purchaseDate: string;
  qrCode?: string;
  qrImage?: string;
  status: "active" | "blocked" | "replaced";
  createdAt: string;
}

interface EmployeeWithPCs extends Student {
  username: string;
  role: string;
  departmentName: string;
  registeredPCs: RegisteredPC[];
}

export default function DepartmentStudentView() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const auth = getAuth("department");
  const authCode = auth?.user?.code ?? "";

  const [employee, setEmployee] = useState<EmployeeWithPCs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenQrImages, setBrokenQrImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }

    loadEmployeeDetails();
  }, [authCode, employeeId, navigate]);

  const buildQrFallbackUrl = (pc: RegisteredPC) => {
    const qrData = pc.qrCode || pc.serialNumber;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData || "N/A")}`;
  };

  const loadEmployeeDetails = async () => {
    setIsLoading(true);
    setError("");
    setBrokenQrImages(new Set());

    try {
      const [userResponse, deviceResponse] = await Promise.all([
        listUsers(),
        listDevices(),
      ]);

      const users = Array.isArray(userResponse) ? userResponse : userResponse.results || [];
      const devices = Array.isArray(deviceResponse) ? deviceResponse : deviceResponse.results || [];

      const employeeData = users.find((user: any) => String(user.id) === String(employeeId))
        || users.find((user: any) => String(user.username) === String(employeeId))
        || users.find((user: any) => String(user.email) === String(employeeId))
        || (employeeId ? null : null);

      if (!employeeData) {
        throw new Error("Employee not found in the department records");
      }

      const fullName = [employeeData.first_name, employeeData.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || employeeData.username || "Employee";

      const departmentName = employeeData.dpt_name || employeeData.dpt_name || auth?.user?.name || "Department";

      const registeredPCs = devices
        .filter((device: any) => {
          const ownerId = typeof device.owner === "object" ? device.owner?.id : device.owner;
          return String(ownerId) === String(employeeData.id);
        })
        .map((device: any) => ({
          id: device.id,
          serialNumber: device.serial_number || device.asset_tag || "N/A",
          model: device.model_name || "",
          brand: device.brand || "",
          purchaseDate: device.created_at || "",
          qrCode: device.qr_token ? String(device.qr_token) : undefined,
          qrImage: device.qr_image ? normalizeImageUrl(device.qr_image) : undefined,
          status: (device.status || "ACTIVE").toLowerCase() === "stolen"
            ? "blocked"
            : (device.status || "ACTIVE").toLowerCase() === "decommissioned"
              ? "replaced"
              : "active",
          createdAt: device.created_at || new Date().toISOString(),
        }));

      setEmployee({
        id: employeeData.id,
        rollNumber: employeeData.username || employeeData.email || "N/A",
        name: fullName,
        email: employeeData.email || "",
        phone: employeeData.phone || "",
        departmentId: employeeData.dpt || employeeData.dpt_name || auth?.user.code || "N/A",
        photo: normalizeImageUrl(employeeData.profile_image),
        username: employeeData.username || "",
        role: employeeData.role || "EMPLOYEE",
        departmentName,
        registeredPCs,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load employee details";
      console.error("Failed to load employee details", err);

      if (errorMessage.toLowerCase().includes("auth") || errorMessage.toLowerCase().includes("credentials") || errorMessage.toLowerCase().includes("unauthorized")) {
        clearAuth("department");
        toast.error("Your session expired. Please log in again.");
        navigate("/dept/login");
        return;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePC = (pcId: string) => {
    if (!employee) return;

    const updatedEmployee = {
      ...employee,
      registeredPCs: employee.registeredPCs.filter((pc) => pc.id !== pcId),
    };
    setEmployee(updatedEmployee);
    toast.success("PC removed successfully");
  };

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  if (!auth) return null;

  if (isLoading) {
    return (
      <PortalLayout
        title="Employee Details"
        onLogout={handleLogout}
        showLogout={true}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading employee details...</p>
        </div>
      </PortalLayout>
    );
  }

  if (error || !employee) {
    return (
      <PortalLayout
        title="Employee Details"
        onLogout={handleLogout}
        showLogout={true}
      >
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate("/dept/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Employee not found"}</AlertDescription>
          </Alert>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Employee Details"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate("/dept/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Employee Information Card */}
        <Card className="p-8 bg-gradient-to-r from-secondary/10 to-accent/10 border-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/25 flex-shrink-0">
              {employee.photo ? (
                <img
                  src={normalizeImageUrl(employee.photo)}
                  alt={employee.name}
                  className="w-full h-full rounded-xl object-cover bg-background"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center text-primary font-bold text-lg uppercase">
                  {employee.name
                    ? employee.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                    : "EM"}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{employee.name}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-mono font-semibold">{employee.rollNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-semibold">{employee.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-sm break-all">{employee.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-semibold">{employee.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-semibold">{employee.departmentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-semibold">{employee.role}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Registered PCs Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Laptop className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">
                Registered PCs ({employee.registeredPCs.length})
              </h3>
            </div>
            <Button
              className="rounded-lg gap-2"
              onClick={() => navigate("/dept/pc-registration")}
            >
              <span>+ Register New PC</span>
            </Button>
          </div>

          {employee.registeredPCs.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed">
              <Laptop className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No registered PCs</p>
              <Button
                className="rounded-lg"
                onClick={() => navigate("/dept/pc-registration")}
              >
                Register First PC
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {employee.registeredPCs.map((pc) => (
                <Card key={pc.id} className="p-6 hover:shadow-md transition-shadow border-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-lg font-bold">
                          {pc.brand} {pc.model}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            pc.status === "active"
                              ? "bg-green-100 text-green-700"
                              : pc.status === "blocked"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {pc.status.charAt(0).toUpperCase() + pc.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">SERIAL NUMBER</p>
                          <p className="font-mono font-semibold">{pc.serialNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">PURCHASE DATE</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold">
                              {new Date(pc.purchaseDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground text-xs mb-1">REGISTERED</p>
                          <p className="font-semibold">
                            {new Date(pc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground text-xs mb-2 font-bold uppercase tracking-wider">Device QR Code</p>
                          <div className="inline-block p-3 rounded-2xl border-2 border-primary/20 bg-white shadow-sm">
                            <QRCodeSVG
                              value={pc.qrCode || pc.serialNumber}
                              size={128}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md gap-2"
                        disabled
                        title="Edit functionality coming soon"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md gap-2 text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePC(pc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
