import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, BarChart3, QrCode, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Index() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Apply dark mode if stored
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white text-lg">
                🛡️
              </div>
              <span>GateGuardian</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (document.documentElement.classList.contains("dark")) {
                  document.documentElement.classList.remove("dark");
                  localStorage.setItem("theme", "light");
                } else {
                  document.documentElement.classList.add("dark");
                  localStorage.setItem("theme", "dark");
                }
                setIsDark(!isDark);
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 gate-gradient" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Campus PC Security & Access Control
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Real-time QR code tracking system for campus assets. Prevent unauthorized device
              movements with instant SMS alerts and secure registration.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <QrCode className="w-5 h-5 text-primary" />
                <span>QR Code Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5 text-secondary" />
                <span>Real-time Alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-5 h-5 text-accent" />
                <span>Analytics & Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Select Your Portal</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Portal Card */}
          <Card className="group card-hover overflow-hidden border-2 hover:border-primary transition-colors">
            <div className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Student Portal</h3>
              <p className="text-muted-foreground mb-6">
                Access your registered PCs, track movements, and manage your devices.
              </p>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-1">✓</span>
                  <span>View your registered PCs with QR codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-1">✓</span>
                  <span>Request new PC registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-1">✓</span>
                  <span>Report lost or stolen devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-1">✓</span>
                  <span>View exit history and analytics</span>
                </li>
              </ul>

              <Link to="/student/login">
                <Button className="w-full gap-2" size="lg">
                  Go to Student Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Department Portal Card */}
          <Card className="group card-hover overflow-hidden border-2 hover:border-secondary transition-colors">
            <div className="p-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Department Head Portal</h3>
              <p className="text-muted-foreground mb-6">
                Manage students, register PCs, and monitor departmental assets.
              </p>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold mt-1">✓</span>
                  <span>Register and manage students</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold mt-1">✓</span>
                  <span>Register PCs with QR generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold mt-1">✓</span>
                  <span>Update PC registrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-bold mt-1">✓</span>
                  <span>View reports and analytics</span>
                </li>
              </ul>

              <Link to="/dept/login">
                <Button variant="secondary" className="w-full gap-2" size="lg">
                  Go to Department Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <QrCode className="w-8 h-8 text-primary mb-4" />
              <h4 className="font-bold mb-2">QR Code System</h4>
              <p className="text-sm text-muted-foreground">
                Unique QR codes for each PC with encrypted student ID and serial number
              </p>
            </div>

            <div className="p-6 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors">
              <AlertCircle className="w-8 h-8 text-secondary mb-4" />
              <h4 className="font-bold mb-2">Real-time Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Instant SMS and email notifications for unauthorized device movements
              </p>
            </div>

            <div className="p-6 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
              <BarChart3 className="w-8 h-8 text-accent mb-4" />
              <h4 className="font-bold mb-2">Analytics & Reports</h4>
              <p className="text-sm text-muted-foreground">
                Comprehensive reports on device movements, peak times, and security events
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>GateGuardian © 2024. Campus PC Security System</p>
        </div>
      </footer>
    </div>
  );
}
