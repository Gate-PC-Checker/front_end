import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth } from "@/lib/auth";
import { createUser } from "@/lib/backend";
import { AlertCircle, Camera, CheckCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GuardFormState {
  fullName: string;
  phone: string;
  email: string;
  department: string;
  password: string;
}

export default function DepartmentCreateGuard() {
  const navigate = useNavigate();
  const auth = getAuth("department");
  const [form, setForm] = useState<GuardFormState>({
    fullName: "",
    phone: "",
    email: "",
    department: auth?.user.code || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }

    setForm((prev) => ({ ...prev, department: auth.user.code || "" }));
  }, [auth, navigate]);

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName || !form.phone || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    const phonePattern = /^\+251[0-9]{9}$/;
    if (!phonePattern.test(form.phone)) {
      setError("Phone number must start with +251 and contain 9 digits after it.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSaving(true);

    try {
      const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/);
      const username = form.email.split("@")[0].toLowerCase();
      const firstNameVal = firstName || form.fullName;
      const lastNameVal = lastNameParts.join(" ");

      if (photoFile) {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("first_name", firstNameVal);
        formData.append("last_name", lastNameVal);
        formData.append("email", form.email);
        formData.append("phone", form.phone);
        formData.append("password", form.password);
        formData.append("role", "GUARD");
        formData.append("profile_image", photoFile);
        await createUser(formData);
      } else {
        await createUser({
          username,
          first_name: firstNameVal,
          last_name: lastNameVal,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: "GUARD",
        });
      }

      setSuccess(`Guard ${form.fullName} has been created successfully.`);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        department: auth?.user.code || "",
        password: "",
      });
      setPhotoPreview("");
      setPhotoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create guard. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  if (!auth) return null;

  return (
    <PortalLayout title="Create Guard" onLogout={handleLogout} showLogout>
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 border-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create New Guard</h2>
              <p className="text-sm text-muted-foreground">
                Add a guard for {auth.user.code} department.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <Button variant="outline" className="rounded-lg" onClick={() => navigate("/dept/reports")}>View Reports</Button>
            <Button variant="outline" className="rounded-lg" onClick={() => navigate("/dept/reports")}>Flagged PCs</Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Photo (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground mt-1">Upload guard profile photo</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g., Bekele Tadesse"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g., +251911234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="guard@dept.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Input value={form.department} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Temporary Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>

            <Button type="submit" className="w-full rounded-lg" disabled={isSaving}>
              {isSaving ? "Creating guard..." : "Create Guard"}
            </Button>
          </form>
        </Card>
      </div>
    </PortalLayout>
  );
}
