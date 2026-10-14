import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyTasks } from "@/hooks/useDecisions";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ProfileDropdown from "@/components/shared/ProfileDropdown";
import WelcomeDialog from "@/components/shared/WelcomeDialog";
import { Badge } from "@/components/ui/badge";
import RoleGate from "@/components/shared/RoleGate";
import { lazy, Suspense, useState } from "react";
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const PeakProjects = lazy(() => import("@/pages/PeakProjects"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Events = lazy(() => import("@/pages/Events"));
const Members = lazy(() => import("@/pages/Members"));
const Career = lazy(() => import("@/pages/Career"));
const Admin = lazy(() => import("@/pages/Admin"));
const Reports = lazy(() => import("@/pages/Reports"));
const ProjectMetricLog = lazy(() => import("@/pages/ProjectMetricLog"));
const LeadershipCompliance = lazy(() => import("@/pages/LeadershipCompliance"));
const SummerProject = lazy(() => import("@/pages/SummerProject"));
const ShowcaseEvent = lazy(() => import("@/pages/ShowcaseEvent"));
const ShowcaseScanner = lazy(() => import("@/pages/ShowcaseScanner"));
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Shield,
  FileText,
  FolderKanban,
  LogOut,
  Menu,
  X,
  CloudRain,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/events", label: "Events", icon: CalendarDays },
  { path: "/members", label: "Members", icon: Users, roles: ["president", "vice_president", "pm", "mc", "domain_leader"] },
  { path: "/reports", label: "Decisions", icon: FileText },
  {
    path: "/leadership-compliance",
    label: "Compliance",
    icon: ClipboardCheck,
    roles: ["president", "vice_president", "domain_leader"],
  },
  { path: "/career", label: "Progression", icon: Briefcase },
  { path: "/projects", label: "Projects", icon: FolderKanban, batches: ["batch_2", "batch_3"], roles: ["pm"] },
  {
    path: "/summer-project",
    label: "Summer project",
    icon: CloudRain,
    visible: (u) => u?.role === "domain_leader" || u?.role === "member",
  },
  { path: "/admin", label: "Admin", icon: Shield, roles: ["president", "pm", "mc"] },
];
const protectedPaths = ["dashboard", "events", "members", "reports", "career", "projects", "summer-project", "leadership-compliance", "admin"];

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: myTasks = [] } = useMyTasks();

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
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-[15px] font-bold leading-none tracking-tight text-primary-foreground">
            PCIC
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            if (item.visible && !item.visible(user)) return null;
            const roleOk = item.roles && item.roles.includes(user?.role);
            const batchOk = item.batches && item.batches.includes(user?.batch);
            if ((item.roles || item.batches) && !roleOk && !batchOk) return null;
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
                {item.path === "/dashboard" && myTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                    {myTasks.length}
                  </Badge>
                )}
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

  // Hard gate: members who logged in with a temporary password must finish
  // onboarding (set name + personal password) before accessing anything else.
  if (user?.mustResetPassword) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} onLogout={logout} />

      {/* Top header bar with profile dropdown */}
      <header className="fixed right-0 top-0 z-30 flex h-14 items-center justify-end gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:left-64">
        <ProfileDropdown />
      </header>

      <main className="p-6 pt-20 lg:ml-64 lg:pt-20">
        <WelcomeDialog />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/members" element={
            <RoleGate allowedRoles={["president", "vice_president", "pm", "mc", "domain_leader"]} fallback={<Navigate to="/dashboard" />}>
              <Members />
            </RoleGate>
          } />
          <Route path="/reports" element={<Reports />} />
          <Route path="/leadership-compliance" element={<LeadershipCompliance />} />
          <Route path="/career" element={<Career />} />
          <Route path="/projects" element={<ProjectMetricLog />} />
          <Route path="/summer-project" element={<SummerProject />} />
          <Route path="/admin" element={
            <RoleGate allowedRoles={["president", "pm", "mc"]} fallback={<Navigate to="/dashboard" />}>
              <Admin />
            </RoleGate>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function NotFound() {
  return <section className="mx-auto max-w-xl py-24 text-center"><h1 className="text-4xl font-bold">Page not found</h1><p className="mt-3 text-muted-foreground">This address does not match a PCIC page.</p><Link to="/dashboard" className="mt-6 inline-block text-primary underline">Go to dashboard</Link></section>;
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
      <Route path="/peak-projects" element={<PeakProjects />} />
      <Route path="/events/project-showcase-semester-kickoff-2026" element={<ShowcaseEvent />} />
      <Route path="/events/project-showcase-semester-kickoff-2026/check-in" element={<ProtectedRoute><ShowcaseScanner /></ProtectedRoute>} />
      {protectedPaths.map((path) => <Route key={path} path={`/${path}/*`} element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />)}
      <Route path="*" element={<main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-4xl font-bold">Page not found</h1><p className="mt-3 text-muted-foreground">This address does not match a PCIC page.</p><Link to="/" className="mt-6 inline-block text-primary underline">Go to homepage</Link></main>} />
    </Routes></Suspense>
  );
}
