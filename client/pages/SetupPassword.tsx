import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle, KeyRound, ArrowLeft } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://gateguard-backend-zzto.onrender.com").replace(/\/+$/, "");

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid setup link. Please check your email for the correct link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/setup-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to set password.");

      setUsername(data.username || "");
      setRole(data.role || "");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "bg-red-500", width: "25%" };
    if (pw.length < 8) return { label: "Weak", color: "bg-orange-500", width: "40%" };
    if (pw.length < 12 && !/[0-9]/.test(pw)) return { label: "Fair", color: "bg-yellow-500", width: "60%" };
    if (pw.length >= 10 && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) return { label: "Strong", color: "bg-emerald-500", width: "100%" };
    return { label: "Good", color: "bg-emerald-400", width: "80%" };
  };

  const strength = getPasswordStrength(newPassword);

  if (!token) {
    return (
      <div className="min-h-screen bg-background mesh-gradient">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 p-8 text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Setup Link</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This link is missing a setup token. Please use the link from your welcome email.
            </p>
            <Link to="/">
              <Button variant="outline" className="rounded-xl gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient transition-colors">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <Card className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2">Password Set Successfully! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your GateGuard account is ready. You can now log in with your username and new password.
              </p>
              <div className="bg-muted/50 rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Username</span>
                  <span className="text-sm font-mono font-bold text-foreground">{username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Account Type</span>
                  <span className="text-sm font-bold text-foreground capitalize">
                    {role === "DPT_ADMIN" ? "Department Admin" : role === "EMPLOYEE" ? "Employee" : role}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {role === "DPT_ADMIN" ? (
                  <Link to="/dept/login" className="flex-1">
                    <Button className="w-full rounded-xl gap-2 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Go to Department Login
                    </Button>
                  </Link>
                ) : (
                  <Link to="/student/login" className="flex-1">
                    <Button className="w-full rounded-xl gap-2 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Go to Employee Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Set Your Password</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Create a strong, secure password to activate your GateGuard account.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl h-11 pr-10 bg-background/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                      </div>
                      <p className={`text-xs font-medium ${strength.color.replace("bg-", "text-")}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`rounded-xl h-11 pr-10 bg-background/50 ${confirmPassword && confirmPassword !== newPassword ? "border-red-400" : confirmPassword && confirmPassword === newPassword ? "border-emerald-400" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground text-sm mb-2">Password requirements:</p>
                  <p className={newPassword.length >= 6 ? "text-emerald-500" : ""}>✓ At least 6 characters</p>
                  <p className={newPassword.length >= 8 ? "text-emerald-500" : ""}>✓ 8+ characters (recommended)</p>
                  <p className={/[0-9]/.test(newPassword) ? "text-emerald-500" : ""}>✓ Include a number</p>
                  <p className={/[^a-zA-Z0-9]/.test(newPassword) ? "text-emerald-500" : ""}>✓ Include a special character</p>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl h-11 text-base font-semibold shadow-md mt-2"
                  disabled={isLoading || !token}
                >
                  {isLoading ? "Setting Password..." : "🔐 Activate My Account"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-border/60 text-center">
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to home
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
