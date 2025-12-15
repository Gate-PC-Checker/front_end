import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, Student, PC } from "@/lib/auth";
import {
  ArrowLeft,
  Laptop,
  AlertCircle,
  Trash2,
  Edit,
  Calendar,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface StudentWithPCs extends Student {
  registeredPCs: PC[];
}

export default function DepartmentStudentView() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const auth = getAuth("department");

  const [student, setStudent] = useState<StudentWithPCs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }

    loadStudentDetails();
  }, [auth, studentId, navigate]);

  const loadStudentDetails = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulated student data with registered PCs
      const mockStudents: Record<string, StudentWithPCs> = {
        STU_BT22B001: {
          id: "STU_BT22B001",
          rollNumber: "BT22B001",
          name: "Abeba Tadesse",
          email: "bt22b001@student.edu",
          phone: "+251911234567",
          departmentId: "CSE",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=abeba",
          registeredPCs: [
            {
              id: "PC_001",
              serialNumber: "DELL-XPS-20240115",
              model: "XPS 13",
              brand: "Dell",
              purchaseDate: "2024-01-15",
              studentId: "STU_BT22B001",
              qrCode: "STU_BT22B001|DELL-XPS-20240115|CSE",
              status: "active",
              createdAt: "2024-01-20",
            },
          ],
        },
        STU_BT22B002: {
          id: "STU_BT22B002",
          rollNumber: "BT22B002",
          name: "Almaz Kebede",
          email: "bt22b002@student.edu",
          phone: "+251922345678",
          departmentId: "CSE",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=almaz",
          registeredPCs: [
            {
              id: "PC_002",
              serialNumber: "HP-PAVILION-20231205",
              model: "Pavilion 15",
              brand: "HP",
              purchaseDate: "2023-12-05",
              studentId: "STU_BT22B002",
              qrCode: "STU_BT22B002|HP-PAVILION-20231205|CSE",
              status: "active",
              createdAt: "2024-01-18",
            },
          ],
        },
        STU_BT22B003: {
          id: "STU_BT22B003",
          rollNumber: "BT22B003",
          name: "Yohannes Desai",
          email: "bt22b003@student.edu",
          phone: "+251933456789",
          departmentId: "CSE",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=yohannes",
          registeredPCs: [],
        },
        STU_BT22B004: {
          id: "STU_BT22B004",
          rollNumber: "BT22B004",
          name: "Selam Haile",
          email: "bt22b004@student.edu",
          phone: "+251944567890",
          departmentId: "CSE",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=selam",
          registeredPCs: [
            {
              id: "PC_003",
              serialNumber: "LENOVO-THINKPAD-20240110",
              model: "ThinkPad E15",
              brand: "Lenovo",
              purchaseDate: "2024-01-10",
              studentId: "STU_BT22B004",
              qrCode: "STU_BT22B004|LENOVO-THINKPAD-20240110|CSE",
              status: "active",
              createdAt: "2024-01-19",
            },
            {
              id: "PC_004",
              serialNumber: "ASUS-VIVOBOOK-20231120",
              model: "VivoBook 15",
              brand: "ASUS",
              purchaseDate: "2023-11-20",
              studentId: "STU_BT22B004",
              qrCode: "STU_BT22B004|ASUS-VIVOBOOK-20231120|CSE",
              status: "replaced",
              createdAt: "2024-01-15",
            },
          ],
        },
        STU_BT22B005: {
          id: "STU_BT22B005",
          rollNumber: "BT22B005",
          name: "Tewodros Bekele",
          email: "bt22b005@student.edu",
          phone: "+251955678901",
          departmentId: "CSE",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=tewodros",
          registeredPCs: [
            {
              id: "PC_005",
              serialNumber: "APPLE-MACBOOK-20240102",
              model: "MacBook Air M2",
              brand: "Apple",
              purchaseDate: "2024-01-02",
              studentId: "STU_BT22B005",
              qrCode: "STU_BT22B005|APPLE-MACBOOK-20240102|CSE",
              status: "active",
              createdAt: "2024-01-20",
            },
          ],
        },
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      const studentData = mockStudents[studentId || ""];
      if (!studentData) {
        throw new Error("Student not found");
      }

      setStudent(studentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load student details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePC = (pcId: string) => {
    if (!student) return;

    // Simulated delete - in production this would call an API
    const updatedStudent = {
      ...student,
      registeredPCs: student.registeredPCs.filter((pc) => pc.id !== pcId),
    };
    setStudent(updatedStudent);
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
        title="Student Details"
        onLogout={handleLogout}
        showLogout={true}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </PortalLayout>
    );
  }

  if (error || !student) {
    return (
      <PortalLayout
        title="Student Details"
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
            <AlertDescription>{error || "Student not found"}</AlertDescription>
          </Alert>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Student Details"
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

        {/* Student Information Card */}
        <Card className="p-8 bg-gradient-to-r from-secondary/10 to-accent/10 border-2">
          <div className="flex items-start gap-6">
            <img
              src={student.photo}
              alt={student.name}
              className="w-20 h-20 rounded-lg"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{student.name}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-mono font-semibold">{student.rollNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-sm break-all">{student.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-semibold">{student.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-semibold">{student.departmentId}</p>
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
                Registered PCs ({student.registeredPCs.length})
              </h3>
            </div>
            <Button
              className="rounded-lg gap-2"
              onClick={() => navigate("/dept/pc-registration")}
            >
              <span>+ Register New PC</span>
            </Button>
          </div>

          {student.registeredPCs.length === 0 ? (
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
              {student.registeredPCs.map((pc) => (
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
