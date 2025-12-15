import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { storeAuth } from "@/lib/auth";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StudentLogin() {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simulated login
      if (!rollNumber || !password) {
        throw new Error("Please fill in all fields");
      }

      if (rollNumber.length < 3) {
        throw new Error("Invalid roll number format");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const studentData = {
        id: `STU_${rollNumber}`,
        rollNumber,
        name: "Nahom Bekele",
        email: `${rollNumber}@student.edu`,
        phone: "+251911234567",
        departmentId: "CSE",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + rollNumber,
      };

      storeAuth("student", "token_" + rollNumber, studentData);
      navigate("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-8">
        <Card className="w-full max-w-md border-2">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-3xl">
                👤
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Student Portal</h1>
            <p className="text-center text-muted-foreground mb-6">
              Login with your roll number and password
            </p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium mb-2">
                  Roll Number
                </label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., BT22B001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground mb-4">
                Demo: Use any roll number like "BT22B001" and any password
              </p>
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
