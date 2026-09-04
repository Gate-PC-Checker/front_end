import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, storeAuth, Student } from "@/lib/auth";
import { listUsers, createUser, createDevice, listDevices, getMeProfile, normalizeImageUrl, listGuestPasses, deleteUser, resendSetupEmail } from "@/lib/backend";
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
  Shield,
  Building2,
  User,
  Trash2,
  ShieldCheck,
  Tag,
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
  totalEmployees: number;
  totalGuards: number;
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
  password: string;
  photo: string;
  pcSerialNumber: string;
}

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const auth = getAuth("department");
  const departmentId = auth?.user?.dptId || auth?.user?.id;
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalGuards: 0,
    totalPCs: 0,
    activeToday: 0,
    flaggedPCs: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [flaggedDevices, setFlaggedDevices] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [activeTab, setActiveTab] = useState<"employees" | "guards" | "flagged">("employees");
  const [isLoading, setIsLoading] = useState(false);
  const [resendingEmailFor, setResendingEmailFor] = useState<string | null>(null);

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
    password: "",
    photo: "",
    pcSerialNumber: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deptPhoto, setDeptPhoto] = useState<string | undefined>(normalizeImageUrl(auth?.user?.photo));
  const [deptImgError, setDeptImgError] = useState(false);
  const [uploadingDeptPhoto, setUploadingDeptPhoto] = useState(false);
  const [failedStudentImages, setFailedStudentImages] = useState<Set<string>>(new Set());
  const deptPhotoInputRef = useRef<HTMLInputElement>(null);

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

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const [userResponse, deviceResponse, guestResponse, meProfile] = await Promise.all([
          listUsers(),
          listDevices(),
          listGuestPasses().catch(() => []),
          getMeProfile().catch(() => null),
        ]);
        const users = Array.isArray(userResponse) ? userResponse : userResponse.results || [];
        const devices = Array.isArray(deviceResponse) ? deviceResponse : deviceResponse.results || [];
        const guestPasses = Array.isArray(guestResponse) ? guestResponse : guestResponse.results || [];

        if (meProfile && meProfile.profile_image) {
          const normalized = normalizeImageUrl(meProfile.profile_image);
          if (normalized) setDeptPhoto(normalized);
        }

        const mappedUsers = users.map((user: any) => ({
          id: user.id,
          rollNumber: user.username || user.email || "N/A",
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "EMPLOYEE",
          departmentId: auth?.user.code || user.dpt || "",
          photo: normalizeImageUrl(user.profile_image),
        }));

        const employees = mappedUsers.filter((user) => user.role === "EMPLOYEE");
        const guardUsers = mappedUsers.filter((user) => user.role === "GUARD");

        // Merge stolen PCs + flagged guest passes
        const stolenPCs = devices.filter((device: any) => device.status === "STOLEN").map((d: any) => ({
          ...d,
          isGuest: false,
          displayName: d.asset_tag || d.serial_number,
          ownerDisplay: d.owner_name || d.owner_username || "Employee",
          typeLabel: "Registered PC",
        }));

        const flaggedGuests = guestPasses.filter((g: any) => g.status === "STOLEN_FLAG" || g.flagged_as_stolen).map((g: any) => ({
          id: g.id,
          isGuest: true,
          pass_id: g.pass_id,
          displayName: `Pass ${g.pass_id}`,
          serial_number: g.serial_number || "N/A",
          ownerDisplay: g.guest_name || "Guest Visitor",
          guard_name: g.guard_name || g.guard_username || "Gate Guard",
          status: "STOLEN / FLAGGED",
          typeLabel: "Guest Device",
          checked_in_at: g.checked_in_at,
          notes: g.checkout_notes,
          id_photo_url: g.id_photo_url || g.id_photo,
        }));

        const combinedFlagged = [...stolenPCs, ...flaggedGuests];

        setStudents(employees);
        setGuards(guardUsers);
        setFlaggedDevices(combinedFlagged);
        setStats({
          totalEmployees: employees.length,
          totalGuards: guardUsers.length,
          totalPCs: devices.length,
          activeToday: devices.filter((device: any) => device.status !== "STOLEN").length,
          flaggedPCs: combinedFlagged.length,
        });
        setRecentActivity([
          {
            id: 1,
            student: "System Sync",
            action: `Loaded ${employees.length} employees, ${guardUsers.length} guards, and ${combinedFlagged.length} flagged devices`,
            pc: `${devices.length} PCs`,
            timestamp: new Date().toLocaleString(),
            status: "success",
          },
        ]);
      } catch (error) {
        console.error(error);
        setRecentActivity([
          {
            id: 1,
            student: "Unable to load data",
            action: "API error",
            pc: "Please check backend",
            timestamp: new Date().toLocaleString(),
            status: "flagged",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [auth?.user.code]);

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      if (userToDelete.role === "GUARD") {
        setGuards((prev) => prev.filter((g) => g.id !== userToDelete.id));
        setStats((prev) => ({ ...prev, totalGuards: Math.max(0, prev.totalGuards - 1) }));
        toast.success(`Guard "${userToDelete.name}" deleted successfully.`);
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== userToDelete.id));
        setStats((prev) => ({ ...prev, totalEmployees: Math.max(0, prev.totalEmployees - 1) }));
        toast.success(`Employee "${userToDelete.name}" deleted successfully.`);
      }
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleResendEmail = async (userId: string, name: string, email: string) => {
    if (!email) {
      toast.error(`${name} has no email address on file. Cannot send setup email.`);
      return;
    }
    setResendingEmailFor(userId);
    try {
      const result = await resendSetupEmail(userId);
      toast.success(result.detail || `Password setup email sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send setup email. Check SMTP configuration.");
    } finally {
      setResendingEmailFor(null);
    }
  };



  const handleDeptPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = sessionStorage.getItem("gateguard_access_token");
    if (!token) return;

    setUploadingDeptPhoto(true);
    try {
      const formData = new FormData();
      formData.append("profile_image", file);

      const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://gateguard-backend-zzto.onrender.com").replace(/\/+$/, "");
      const res = await fetch(`${API_BASE}/api/auth/me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const finalUrl = normalizeImageUrl(data.profile_image);

      setDeptPhoto(finalUrl);
      setDeptImgError(false);

      if (auth) {
        storeAuth("department", token, { ...auth.user, photo: finalUrl });
      }

      toast.success("Department photo updated successfully!");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingDeptPhoto(false);
      if (deptPhotoInputRef.current) deptPhotoInputRef.current.value = "";
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async () => {
    const { fullname, rollNumber, phone, email, department, password } = newStudentForm;

    if (!fullname || !rollNumber || !phone || !email || !department || !password) {
      toast.error("Please fill in all required fields including a password");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    const phonePattern = /^\+251[0-9]{9}$/;
    if (!phonePattern.test(phone)) {
      toast.error("Phone number must start with +251 and contain 9 digits after it");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAddingStudent(true);

    try {
      let payload: any = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("username", rollNumber);
        formData.append("first_name", fullname.split(" ")[0] || fullname);
        formData.append("last_name", fullname.split(" ").slice(1).join(" ") || "");
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("password", password);
        formData.append("role", "EMPLOYEE");
        formData.append("profile_image", photoFile);
        payload = await createUser(formData);
      } else {
        payload = await createUser({
          username: rollNumber,
          first_name: fullname.split(" ")[0] || fullname,
          last_name: fullname.split(" ").slice(1).join(" ") || "",
          email,
          phone,
          password,
          role: "EMPLOYEE",
        });
      }

      let createdDevice: any = null;
      const serialNumber = newStudentForm.pcSerialNumber.trim();
      if (serialNumber) {
        try {
          createdDevice = await createDevice({
            asset_tag: serialNumber,
            brand: "",
            model_name: "",
            serial_number: serialNumber,
            owner: payload.id,
            dpt: departmentId || undefined,
          });
        } catch (deviceError) {
          console.error("Failed to create device for employee", deviceError);
          toast.error("Employee was created, but the device/QR entry could not be created.");
        }
      }

      const newStudent: Student = {
        id: payload.id,
        rollNumber: payload.username || rollNumber,
        name: fullname,
        email: payload.email || email,
        phone: payload.phone || phone,
        departmentId: department,
        photo: normalizeImageUrl(payload.profile_image) || photoPreview || undefined,
      };

      setStudents((prev) => [...prev, newStudent]);

      const newActivity = {
        id: recentActivity.length + 1,
        student: fullname,
        action: createdDevice ? "Employee and QR registered" : "Employee Registered",
        pc: serialNumber || "Pending",
        timestamp: new Date().toLocaleString(),
        status: "success",
      };
      setRecentActivity((prev) => [newActivity, ...prev]);

      setStats((prev) => ({
        ...prev,
        totalEmployees: prev.totalEmployees + 1,
        totalPCs: prev.totalPCs + (createdDevice ? 1 : 0),
      }));

      setAddStudentSuccess(true);
      toast.success(createdDevice ? `Employee "${fullname}" added and QR generated successfully!` : `Employee "${fullname}" added successfully!`);

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
          password: "",
          photo: "",
          pcSerialNumber: "",
        });
        setPhotoPreview("");
        setPhotoFile(null);
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
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 p-8 sm:p-10 shadow-xl backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/25 relative">
                {deptPhoto && !deptImgError ? (
                  <img
                    src={deptPhoto}
                    alt={auth.user.name}
                    className="w-full h-full rounded-xl object-cover bg-background"
                    onError={() => setDeptImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-background flex items-center justify-center text-primary font-bold">
                    <Building2 className="w-10 h-10 text-primary" />
                  </div>
                )}

                {/* Upload Hover Overlay */}
                <button
                  type="button"
                  onClick={() => deptPhotoInputRef.current?.click()}
                  disabled={uploadingDeptPhoto}
                  className="absolute inset-1 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  title="Change Department Photo"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">
                    {uploadingDeptPhoto ? "..." : "Change"}
                  </span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={deptPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDeptPhotoUpload}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Shield className="w-3.5 h-3.5" />
                Department Administrator
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {auth.user.name}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                Department Code: <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted">{auth.user.code}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                onClick={() => setShowAddStudentModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-border/80 hover:bg-muted"
                onClick={() => navigate("/dept/create-guard")}
              >
                <Shield className="w-4 h-4 text-primary" />
                Create Guard
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-border/80 hover:bg-muted"
                onClick={() => navigate("/dept/reports")}
              >
                <BarChart3 className="w-4 h-4 text-accent" />
                Reports
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Employees</p>
                <p className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">{stats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Guards on Duty</p>
                <p className="text-3xl font-extrabold text-foreground group-hover:text-secondary transition-colors">{stats.totalGuards}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Registered PCs</p>
                <p className="text-3xl font-extrabold text-foreground group-hover:text-accent transition-colors">{stats.totalPCs}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Flagged / Stolen</p>
                <p className="text-3xl font-extrabold text-destructive">{stats.flaggedPCs}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Selection Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl border border-border/60">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "employees"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              Employees ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("guards")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "guards"
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" />
              Guards on Duty ({guards.length})
            </button>
            <button
              onClick={() => setActiveTab("flagged")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "flagged"
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Flagged & Stolen ({flaggedDevices.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "employees" && (
              <Button
                className="rounded-xl gap-2 shadow-sm"
                onClick={() => setShowAddStudentModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            )}
            {activeTab === "guards" && (
              <Button
                className="rounded-xl gap-2 shadow-sm bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => navigate("/dept/create-guard")}
              >
                <Plus className="w-4 h-4" />
                Add New Guard
              </Button>
            )}
          </div>
        </div>

        {/* ── TAB 1: EMPLOYEES ── */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border/80 shadow-md overflow-hidden bg-card/80 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="text-left p-4 pl-6">Employee</th>
                      <th className="text-left p-4">ID Number</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Phone</th>
                      <th className="text-right p-4 pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground">
                          No employees registered in this department yet.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/40 transition-colors group">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              {student.photo && !failedStudentImages.has(student.id) ? (
                                <img
                                  src={normalizeImageUrl(student.photo)}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-border bg-background"
                                  onError={() => {
                                    setFailedStudentImages((prev) => {
                                      const next = new Set(prev);
                                      next.add(student.id);
                                      return next;
                                    });
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                  {student.name
                                    ? student.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join("")
                                    : "EM"}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-foreground group-hover:text-primary transition-colors">{student.name}</span>
                                <p className="text-xs text-muted-foreground font-mono">{student.rollNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-foreground">{student.rollNumber}</td>
                          <td className="p-4 text-muted-foreground">{student.email || "—"}</td>
                          <td className="p-4 text-muted-foreground">{student.phone || "—"}</td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                                onClick={() => navigate(`/dept/employee/${student.id}`)}
                              >
                                Manage PCs
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold hover:bg-blue-500 hover:text-white transition-colors gap-1"
                                title="Resend password setup email"
                                disabled={resendingEmailFor === student.id}
                                onClick={() => handleResendEmail(student.id, student.name, student.email)}
                              >
                                {resendingEmailFor === student.id ? "Sending..." : "📧 Resend Email"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive p-2 h-9 w-9"
                                title="Delete Employee"
                                onClick={() => setUserToDelete({ id: student.id, name: student.name, role: "EMPLOYEE" })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 2: GUARDS ON DUTY ── */}
        {activeTab === "guards" && (
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border/80 shadow-md overflow-hidden bg-card/80 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="text-left p-4 pl-6">Officer</th>
                      <th className="text-left p-4">Username / ID</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Phone</th>
                      <th className="text-right p-4 pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {guards.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground">
                          No security guards assigned to this department yet. Click "Add New Guard" above to register one.
                        </td>
                      </tr>
                    ) : (
                      guards.map((guard) => (
                        <tr key={guard.id} className="hover:bg-muted/40 transition-colors group">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              {guard.photo ? (
                                <img
                                  src={normalizeImageUrl(guard.photo)}
                                  alt={guard.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-border bg-background"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xs uppercase">
                                  <Shield className="w-5 h-5 text-secondary" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-foreground group-hover:text-secondary transition-colors">{guard.name}</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                                  Guard
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-foreground">{guard.rollNumber}</td>
                          <td className="p-4 text-muted-foreground">{guard.email || "—"}</td>
                          <td className="p-4 text-muted-foreground">{guard.phone || "—"}</td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold hover:bg-blue-500 hover:text-white transition-colors gap-1"
                                title="Resend password setup email"
                                disabled={resendingEmailFor === guard.id}
                                onClick={() => handleResendEmail(guard.id, guard.name, guard.email)}
                              >
                                {resendingEmailFor === guard.id ? "Sending..." : "📧 Resend Email"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive p-2 h-9 w-9"
                                title="Delete Guard"
                                onClick={() => setUserToDelete({ id: guard.id, name: guard.name, role: "GUARD" })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 3: FLAGGED & STOLEN DEVICES ── */}
        {activeTab === "flagged" && (
          <div className="space-y-4">
            {flaggedDevices.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl border border-border/80 bg-card/80">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground">No Flagged or Stolen Devices</h3>
                <p className="text-sm text-muted-foreground mt-1">All employee laptops and guest devices are currently verified and clear.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {flaggedDevices.map((device: any) => (
                  <Card key={device.id} className="p-5 rounded-3xl border-2 border-destructive/40 bg-destructive/5 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          device.isGuest
                            ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                            : "bg-destructive/20 text-destructive border border-destructive/30"
                        }`}>
                          {device.typeLabel}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-destructive text-white shadow-sm">
                          {device.status}
                        </span>
                      </div>

                      <h4 className="text-lg font-extrabold font-mono text-foreground mb-1">{device.displayName}</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Serial Number: <span className="font-mono font-bold text-foreground">{device.serial_number}</span>
                      </p>

                      <div className="p-3 bg-background/80 rounded-xl border border-border/60 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{device.isGuest ? "Guest Name:" : "Owner:"}</span>
                          <span className="font-bold text-foreground">{device.ownerDisplay}</span>
                        </div>
                        {device.guard_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Flagged by Officer:</span>
                            <span className="font-semibold text-foreground">{device.guard_name}</span>
                          </div>
                        )}
                        {device.checked_in_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recorded Time:</span>
                            <span className="font-mono">{new Date(device.checked_in_at).toLocaleString()}</span>
                          </div>
                        )}
                        {device.notes && (
                          <div className="pt-1 border-t border-border/40 text-destructive font-medium">
                            Notes: {device.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
          {addStudentSuccess ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Employee Added Successfully</h2>
              <p className="text-muted-foreground">
                {newStudentForm.fullname} has been added to the department.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Add New Employee
                </DialogTitle>
                <DialogDescription>
                  Fill in the employee details below. Photo and PC serial number are optional.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
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
                        Optional employee profile photo
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
                    placeholder="Enter employee's full name"
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
                      Employee ID *
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
                      placeholder="employee@example.com"
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
                      placeholder="+251911234567"
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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Temporary Password *
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a password (min 8 characters)"
                    value={newStudentForm.password}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
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
                      password: "",
                      photo: "",
                      pcSerialNumber: "",
                    });
                    setPhotoPreview("");
                    setPhotoFile(null);
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
                      Add Employee
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete {userToDelete?.role === "GUARD" ? "Security Guard" : "Employee"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <strong className="text-foreground">{userToDelete?.name}</strong>?
              This action cannot be undone and will permanently remove their account from your department.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={isDeletingUser}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="rounded-xl gap-2"
            >
              {isDeletingUser ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
