import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { storeAuth } from "@/lib/auth";
import { login, getMeProfile, resetForgotPassword, normalizeImageUrl } from "@/lib/backend";
import { AlertCircle, Eye, EyeOff, KeyRound, CheckCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function StudentLogin() {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!rollNumber.trim() || !password) {
        throw new Error("Please fill in all fields");
      }

      const authResponse = await login(rollNumber.trim(), password);
      const profile = await getMeProfile().catch(() => null);

      const employeeData = {
        id: profile?.id || authResponse.user_id,
        rollNumber: profile?.username || authResponse.username || rollNumber.trim(),
        name: [profile?.first_name || authResponse.first_name, profile?.last_name || authResponse.last_name].filter(Boolean).join(" ") || profile?.username || authResponse.username || rollNumber.trim(),
        email: profile?.email || authResponse.email || "",
        phone: profile?.phone || "",
        departmentId: profile?.dpt_name || profile?.dpt_code || authResponse.dpt_name || authResponse.dpt_code || "",
        photo: normalizeImageUrl(profile?.profile_image || authResponse.profile_image),
        role: profile?.role || authResponse.role || "EMPLOYEE",
        accessToken: authResponse.access,
        refreshToken: authResponse.refresh,
      };

      storeAuth("student", authResponse.access, employeeData);
      navigate("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const [resetMessage, setResetMessage] = useState("");

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      if (!forgotId.trim()) {
        throw new Error("Please enter your Employee ID, Username, or registered Email.");
      }

      const res = await resetForgotPassword(forgotId.trim(), forgotEmail.trim() || undefined);
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
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Employee Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your ID number and password to access your PCs
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rollNumber" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Employee ID
              </label>
              <Input
                id="rollNumber"
                placeholder="e.g., ET089219"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="rounded-xl h-11 font-mono bg-background/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotId(rollNumber);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-11 pr-10 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-11 text-base font-semibold shadow-md mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to portal selection
            </Link>
          </div>
        </Card>
      </div>

      {/* Forgot Password Reset Modal */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8 bg-card">
          {forgotSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Reset Email Dispatched!</h3>
              <p className="text-sm text-muted-foreground">
                {resetMessage || "A secure password reset link has been sent to your registered email address."}
              </p>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 text-left space-y-1">
                <p className="font-bold">Next Steps:</p>
                <p>1. Open your email inbox and click the reset link.</p>
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
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <DialogTitle className="text-xl font-bold">Reset Employee Password</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter your Employee ID or registered email address. We will send a secure password reset link to your email.
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
                    Employee ID, Username, or Email *
                  </label>
                  <Input
                    placeholder="e.g., ET089219 or employee@company.com"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
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
