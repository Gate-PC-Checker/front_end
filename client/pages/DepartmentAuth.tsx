import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { storeAuth } from "@/lib/auth";
import { login as loginToBackend, getMeProfile, resetForgotPassword, normalizeImageUrl } from "@/lib/backend";
import { AlertCircle, Eye, EyeOff, Building2, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DepartmentAuth() {
  const navigate = useNavigate();

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotDptCode, setForgotDptCode] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      if (!loginUsername.trim() || !loginPassword) {
        throw new Error("Please fill in all fields");
      }

      const authResponse = await loginToBackend(loginUsername.trim(), loginPassword);

      if (authResponse.role !== "DPT_ADMIN" && authResponse.role !== "SUPER_ADMIN") {
        throw new Error("Access denied: This account is not a Department Admin.");
      }

      const profile = await getMeProfile().catch(() => null);

      const dptCode = authResponse.dpt_code || profile?.dpt_code || loginUsername.trim().toUpperCase();
      const dptName = authResponse.dpt_name || profile?.dpt_name || profile?.first_name || profile?.username || dptCode;

      const deptData = {
        id: authResponse.dpt_id || profile?.dpt || profile?.id || loginUsername.trim(),
        dptId: authResponse.dpt_id || profile?.dpt || profile?.id || loginUsername.trim(),
        code: dptCode,
        name: dptName,
        headName: [profile?.first_name || authResponse.first_name, profile?.last_name || authResponse.last_name].filter(Boolean).join(" ") || profile?.username || authResponse.username || "Department Admin",
        email: profile?.email || authResponse.email || `${loginUsername.trim()}@dept.edu`,
        phone: profile?.phone || "",
        photo: normalizeImageUrl(profile?.profile_image || authResponse.profile_image),
      };

      storeAuth("department", authResponse.access, deptData);
      navigate("/dept/dashboard");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const [resetMessage, setResetMessage] = useState("");

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      if (!forgotDptCode.trim()) {
        throw new Error("Please enter your Department Code, Admin Username, or registered Email.");
      }

      const res = await resetForgotPassword(forgotDptCode.trim(), forgotEmail.trim() || undefined);
      setResetMessage(res.detail || "A password reset link has been sent to your email address.");
      setForgotSuccess(true);
      toast.success("Password reset email sent!");
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background mesh-gradient transition-colors">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary via-primary to-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-secondary/20 mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Department Admin Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your department code or administrator username
            </p>
          </div>

          {loginError && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Department Code / Admin Username
              </label>
              <Input
                placeholder="e.g., ITC or itc_admin"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="rounded-xl pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-base mt-2"
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in..." : "Sign In to Department"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8 bg-card">
          {forgotSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Reset Email Dispatched!</h3>
              <p className="text-sm text-muted-foreground">
                {resetMessage || "A secure password reset link has been sent to your registered department email."}
              </p>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 text-left space-y-1">
                <p className="font-bold">Next Steps:</p>
                <p>1. Open your department email inbox and click the reset link.</p>
                <p>2. Set a strong password (minimum 8 characters with letters & numbers).</p>
                <p>3. Return here to sign in with your new password.</p>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
              >
                Understood, Go to Login
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <DialogTitle className="text-xl font-bold">Reset Department Password</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter your Department Code, Admin Username, or registered email. We will send a secure password reset link to your email.
                </DialogDescription>
              </DialogHeader>

              {forgotError && (
                <Alert variant="destructive" className="my-2 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 py-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Department Code, Username, or Email *
                  </label>
                  <Input
                    placeholder="e.g., ITC or itc@company.com"
                    value={forgotDptCode}
                    onChange={(e) => setForgotDptCode(e.target.value)}
                    className="rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl shadow-md"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending Link..." : "Send Reset Email"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
