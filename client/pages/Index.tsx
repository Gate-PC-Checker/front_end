import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, BarChart3, QrCode, AlertCircle, ShieldCheck, Moon, Sun, Laptop, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Index() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <div className="min-h-screen bg-background mesh-gradient transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  GateGuard
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground -mt-1">
                  Asset Security
                </span>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-foreground" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Campus & Enterprise Asset Verification
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            Smart Device Security & Gate Authorization
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Encrypted QR code asset management for enterprise & campus hardware. Prevent unauthorized device movements with real-time guard verification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 border border-border/80 shadow-sm">
              <QrCode className="w-4 h-4 text-primary" />
              <span>Encrypted QR Verification</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 border border-border/80 shadow-sm">
              <Shield className="w-4 h-4 text-secondary" />
              <span>Dual Check-in & Check-out</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 border border-border/80 shadow-sm">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span>Stolen Device Blacklisting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Select Your Portal</h2>
          <p className="text-sm text-muted-foreground">Choose your authorized portal to manage devices or access your registered hardware</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Employee Portal Card */}
          <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Employee Portal
                </h3>
                <p className="text-muted-foreground text-sm">
                  View your verified laptops, obtain high-res exit QR codes, and report lost or stolen devices.
                </p>
              </div>

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Instant access to your verified PC QR codes</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Direct QR image download & mobile display</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>One-click instant Lost/Stolen security flag</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-border/60">
              <Link to="/student/login">
                <Button className="w-full gap-2 rounded-2xl shadow-md h-12 text-base font-semibold">
                  Access Employee Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Department Head Portal Card */}
          <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl hover:border-secondary/50 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Laptop className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                  Department Admin Portal
                </h3>
                <p className="text-muted-foreground text-sm">
                  Register employee PCs with auto-generated stickers, provision gate guard accounts, and monitor assets.
                </p>
              </div>

              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Register employee PCs with automated QR tokens</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Create & provision gate guard credentials</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Audit scan logs & flagged security incidents</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-border/60">
              <Link to="/dept/login">
                <Button variant="secondary" className="w-full gap-2 rounded-2xl shadow-md h-12 text-base font-semibold">
                  Access Department Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 py-10 mt-16 text-center text-sm text-muted-foreground bg-card/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">GateGuard</span>
            <span>— Campus & Enterprise Asset Protection</span>
          </div>
          <p>© {new Date().getFullYear()} GateGuard Security Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
