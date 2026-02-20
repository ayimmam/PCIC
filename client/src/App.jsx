import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import RoleGate from "@/components/shared/RoleGate";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import Members from "@/pages/Members";
import Career from "@/pages/Career";
import Admin from "@/pages/Admin";
import Reports from "@/pages/Reports";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Shield,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/events", label: "Events", icon: CalendarDays },
  { path: "/members", label: "Members", icon: Users },
  { path: "/reports", label: "Decisions", icon: FileText },
  { path: "/career", label: "Career", icon: Briefcase },
  { path: "/admin", label: "Admin", icon: Shield, roles: ["president", "pm", "mc"] },
];

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            PC
          </div>
          <span className="font-semibold">PCIC</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role)) return null;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <Sidebar user={user} onLogout={logout} />
      <main className="p-6 pt-20 lg:ml-64 lg:pt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/members" element={<Members />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/career" element={<Career />} />
          <Route path="/admin" element={
            <RoleGate allowedRoles={["president", "pm", "mc"]} fallback={<Navigate to="/" />}>
              <Admin />
            </RoleGate>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
