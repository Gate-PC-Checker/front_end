import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import DepartmentAuth from "./pages/DepartmentAuth";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import DepartmentPCRegistration from "./pages/DepartmentPCRegistration";
import DepartmentStudentView from "./pages/DepartmentStudentView";
import DepartmentReports from "./pages/DepartmentReports";
import DepartmentCreateGuard from "./pages/DepartmentCreateGuard";
import SetupPassword from "./pages/SetupPassword";

const queryClient = new QueryClient();

// Initialize dark mode
if (!document.documentElement.classList.contains("dark")) {
  const savedTheme = localStorage.getItem("theme");
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/dept/login" element={<DepartmentAuth />} />
          <Route path="/dept/dashboard" element={<DepartmentDashboard />} />
          <Route path="/dept/pc-registration" element={<DepartmentPCRegistration />} />
          <Route path="/dept/employee/:employeeId" element={<DepartmentStudentView />} />
          <Route path="/dept/reports" element={<DepartmentReports />} />
          <Route path="/dept/create-guard" element={<DepartmentCreateGuard />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
