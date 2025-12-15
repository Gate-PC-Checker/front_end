import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { storeAuth } from "@/lib/auth";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DepartmentAuth() {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();

  // Login state
  const [loginDeptCode, setLoginDeptCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration state
  const [regDeptName, setRegDeptName] = useState("");
  const [regDeptCode, setRegDeptCode] = useState("");
  const [regHeadName, setRegHeadName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      if (!loginDeptCode || !loginPassword) {
        throw new Error("Please fill in all fields");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const deptData = {
        id: `DEPT_${loginDeptCode}`,
        code: loginDeptCode,
        name: "Computer Science & Engineering",
        headName: "Prof. Dr. Smith",
        email: `${loginDeptCode}@dept.edu`,
        phone: "+91-9876543210",
      };

      storeAuth("department", "token_" + loginDeptCode, deptData);
      navigate("/dept/dashboard");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    try {
      if (!regDeptName || !regDeptCode || !regHeadName || !regEmail || !regPhone || !regPassword) {
        throw new Error("Please fill in all fields");
      }

      if (regPassword !== regConfirm) {
        throw new Error("Passwords do not match");
      }

      if (regPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (!regEmail.includes("@")) {
        throw new Error("Invalid email address");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const deptData = {
        id: `DEPT_${regDeptCode}`,
        code: regDeptCode,
        name: regDeptName,
        headName: regHeadName,
        email: regEmail,
        phone: regPhone,
      };

      storeAuth("department", "token_" + regDeptCode, deptData);
      setRegSuccess("Registration successful! Redirecting to dashboard...");

      setTimeout(() => {
        navigate("/dept/dashboard");
      }, 1500);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <Card className="w-full max-w-md border-2">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center text-3xl">
                🏛️
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Department Portal</h1>
            <p className="text-center text-muted-foreground mb-6">
              Manage students and PCs registration
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-lg mb-6">
                <TabsTrigger value="login" className="rounded-md">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-md">
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="deptCode" className="block text-sm font-medium mb-2">
                      Department Code
                    </label>
                    <Input
                      id="deptCode"
                      placeholder="e.g., CSE"
                      value={loginDeptCode}
                      onChange={(e) => setLoginDeptCode(e.target.value.toUpperCase())}
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-lg"
                    disabled={loginLoading}
                    size="lg"
                  >
                    {loginLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center">
                  Demo: Use "CSE" and any password
                </p>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                {regError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{regError}</AlertDescription>
                  </Alert>
                )}

                {regSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {regSuccess}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Department Name
                    </label>
                    <Input
                      placeholder="e.g., Computer Science & Engineering"
                      value={regDeptName}
                      onChange={(e) => setRegDeptName(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Department Code
                    </label>
                    <Input
                      placeholder="e.g., CSE"
                      value={regDeptCode}
                      onChange={(e) => setRegDeptCode(e.target.value.toUpperCase())}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Head Name
                    </label>
                    <Input
                      placeholder="Department Head Name"
                      value={regHeadName}
                      onChange={(e) => setRegHeadName(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="dept@university.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <Input
                      placeholder="+91-XXXXXXXXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full rounded-lg text-sm"
                    disabled={regLoading}
                  >
                    {regLoading ? "Registering..." : "Register Department"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <Link to="/" className="text-primary hover:underline">
                ← Back to portals
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
