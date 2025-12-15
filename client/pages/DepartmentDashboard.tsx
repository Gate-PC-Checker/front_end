import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, Student } from "@/lib/auth";
import {
  Users,
  Laptop,
  BarChart3,
  Plus,
  Clock,
  AlertCircle,
  TrendingUp,
  Camera,
  CheckCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DashboardStats {
  totalStudents: number;
  totalPCs: number;
  activeToday: number;
  flaggedPCs: number;
}

interface NewStudentForm {
  fullname: string;
  rollNumber: string;
  phone: string;
  email: string;
  department: string;
  photo: string;
  pcSerialNumber: string;
}

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const auth = getAuth("department");
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalPCs: 0,
    activeToday: 0,
    flaggedPCs: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Add New Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addStudentSuccess, setAddStudentSuccess] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState<NewStudentForm>({
    fullname: "",
    rollNumber: "",
    phone: "",
    email: "",
    department: "",
    photo: "",
    pcSerialNumber: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }
  }, [auth, navigate]);

  // Initialize form and data after auth check
  useEffect(() => {
    if (!auth) return;

    // Initialize form with department
    setNewStudentForm((prev) => ({
      ...prev,
      department: auth.user.code,
    }));

    // Simulated stats
    setStats({
      totalStudents: 87,
      totalPCs: 92,
      activeToday: 34,
      flaggedPCs: 2,
    });

    // Simulated student list
    setStudents([
      {
        id: "STU_BT22B001",
        rollNumber: "BT22B001",
        name: "Abeba Tadesse",
        email: "bt22b001@student.edu",
        phone: "+251911234567",
        departmentId: "CSE",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=abeba",
      },
      {
        id: "STU_BT22B002",
        rollNumber: "BT22B002",
        name: "Almaz Kebede",
        email: "bt22b002@student.edu",
        phone: "+251922345678",
        departmentId: "CSE",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=almaz",
      },
      {
        id: "STU_BT22B003",
        rollNumber: "BT22B003",
        name: "Yohannes Desai",
        email: "bt22b003@student.edu",
        phone: "+251933456789",
        departmentId: "CSE",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=yohannes",
      },
    ]);

    // Simulated recent activity
    setRecentActivity([
      {
        id: 1,
        student: "Abeba Tadesse",
        action: "Registered PC",
        pc: "DELL-XPS-20240115",
        timestamp: "2024-01-20 14:30",
        status: "success",
      },
      {
        id: 2,
        student: "Almaz Kebede",
        action: "PC Change Request",
        pc: "HP-PAVILION-20231205",
        timestamp: "2024-01-20 13:15",
        status: "pending",
      },
      {
        id: 3,
        student: "Yohannes Desai",
        action: "Reported Lost PC",
        pc: "LENOVO-IDEAPAD",
        timestamp: "2024-01-20 11:20",
        status: "flagged",
      },
    ]);
  }, [auth?.user.code]);

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        // Generate avatar URL based on roll number
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStudentForm.rollNumber || "student"}`;
        setNewStudentForm((prev) => ({ ...prev, photo: avatarUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async () => {
    const { fullname, rollNumber, phone, email, department } = newStudentForm;

    if (!fullname || !rollNumber || !phone || !email || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsAddingStudent(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rollNumber}`;
      const newStudent: Student = {
        id: `STU_${rollNumber}`,
        rollNumber,
        name: fullname,
        email: email,
        phone,
        departmentId: department,
        photo: avatarUrl,
      };

      setStudents((prev) => [...prev, newStudent]);

      // Add to recent activity
      const newActivity = {
        id: recentActivity.length + 1,
        student: fullname,
        action: "Student Registered",
        pc: newStudentForm.pcSerialNumber || "Pending",
        timestamp: new Date().toLocaleString(),
        status: "success",
      };
      setRecentActivity((prev) => [newActivity, ...prev]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalStudents: prev.totalStudents + 1,
      }));

      setAddStudentSuccess(true);
      toast.success(`Student "${fullname}" added successfully!`);

      // Reset form
      setTimeout(() => {
        setShowAddStudentModal(false);
        setAddStudentSuccess(false);
        setNewStudentForm({
          fullname: "",
          rollNumber: "",
          phone: "",
          email: "",
          department: auth?.user.code || "",
          photo: "",
          pcSerialNumber: "",
        });
        setPhotoPreview("");
        setIsAddingStudent(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to add student");
      setIsAddingStudent(false);
    }
  };

  if (!auth) return null;

  return (
    <PortalLayout
      title="Department Dashboard"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-0">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">{auth.user.name}</h2>
            <p className="text-muted-foreground">
              Department: {auth.user.code} | {auth.user.name}
            </p>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover p-6 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="card-hover p-6 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total PCs</p>
                <p className="text-3xl font-bold">{stats.totalPCs}</p>
              </div>
              <Laptop className="w-10 h-10 text-secondary opacity-50" />
            </div>
          </Card>

          <Card className="card-hover p-6 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Today</p>
                <p className="text-3xl font-bold">{stats.activeToday}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="card-hover p-6 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Flagged PCs</p>
                <p className="text-3xl font-bold text-red-600">{stats.flaggedPCs}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button
            className="gap-2 rounded-lg"
            size="lg"
            onClick={() => setShowAddStudentModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            size="lg"
            onClick={() => navigate("/dept/pc-registration")}
          >
            <Laptop className="w-4 h-4" />
            Register PC
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            size="lg"
            onClick={() => navigate("/dept/reports")}
          >
            <BarChart3 className="w-4 h-4" />
            View Reports
          </Button>
        </div>

        {/* Students Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Department Students</h3>
            <Button
              size="sm"
              className="rounded-lg gap-2"
              onClick={() => setShowAddStudentModal(true)}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-card">
                  <tr>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Roll No</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photo}
                            alt={student.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{student.rollNumber}</td>
                      <td className="p-4 text-sm">{student.email}</td>
                      <td className="p-4 text-sm">{student.phone}</td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-md text-xs"
                          onClick={() => navigate(`/dept/student/${student.id}`)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          <Card>
            <div className="divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.student}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.action} - {item.pc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "success"
                          ? "bg-green-100 text-green-700"
                          : item.status === "pending"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Add New Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
          {addStudentSuccess ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Student Added Successfully</h2>
              <p className="text-muted-foreground">
                {newStudentForm.fullname} has been added to the department.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Add New Student
                </DialogTitle>
                <DialogDescription>
                  Fill in the student details below. Photo and PC serial number are optional.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : newStudentForm.rollNumber ? (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${newStudentForm.rollNumber}`}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="block w-full text-sm text-muted-foreground
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-primary-foreground
                          hover:file:opacity-80
                          cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-generated avatar if not uploaded
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="fullname"
                    placeholder="Enter student's full name"
                    value={newStudentForm.fullname}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        fullname: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>

                {/* Roll Number / ID */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rollNumber" className="block text-sm font-medium mb-2">
                      Roll Number / ID *
                    </label>
                    <Input
                      id="rollNumber"
                      placeholder="e.g., BT22B001"
                      value={newStudentForm.rollNumber}
                      onChange={(e) =>
                        setNewStudentForm((prev) => ({
                          ...prev,
                          rollNumber: e.target.value.toUpperCase(),
                        }))
                      }
                      className="rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={newStudentForm.email}
                      onChange={(e) =>
                        setNewStudentForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Phone Number *
                    </label>
                    <Input
                      id="phone"
                      placeholder="+91-XXXXXXXXXX"
                      value={newStudentForm.phone}
                      onChange={(e) =>
                        setNewStudentForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-2">
                      Department
                    </label>
                    <Input
                      id="department"
                      placeholder="Department Code"
                      value={newStudentForm.department}
                      disabled
                      className="rounded-lg bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your account</p>
                  </div>
                </div>

                {/* PC Serial Number */}
                <div>
                  <label htmlFor="pcSerialNumber" className="block text-sm font-medium mb-2">
                    PC Serial Number (Optional)
                  </label>
                  <Input
                    id="pcSerialNumber"
                    placeholder="e.g., DELL-XPS-20240115"
                    value={newStudentForm.pcSerialNumber}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        pcSerialNumber: e.target.value.toUpperCase(),
                      }))
                    }
                    className="rounded-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Can be added or updated later during PC registration
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNewStudentForm({
                      fullname: "",
                      rollNumber: "",
                      phone: "",
                      email: "",
                      department: auth?.user.code || "",
                      photo: "",
                      pcSerialNumber: "",
                    });
                    setPhotoPreview("");
                  }}
                  disabled={isAddingStudent}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className="gap-2 rounded-lg"
                >
                  {isAddingStudent ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Student
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
