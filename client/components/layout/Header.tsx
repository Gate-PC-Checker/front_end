import { useEffect, useState } from "react";
import { Moon, Sun, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  onLogout?: () => void;
  showLogout?: boolean;
}

export function Header({ title, onLogout, showLogout = false }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/80 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              GateGuard
            </span>
          </Link>

          {title && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h1>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </Button>
            {showLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-2 rounded-full px-4 border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium text-xs">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
