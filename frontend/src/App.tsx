import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import DashboardPage from "./pages/DashboardPage";
import GlobalDashboardPage from "./pages/GlobalDashboardPage";
import { FolderOpen, LayoutDashboard, LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import "./App.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn btn btn-ghost btn-icon" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay on mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">T</div>
          <span className="sidebar-title">Task Manager</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            <button className={`nav-item ${isActive("/dashboard") && location.pathname === "/dashboard" ? "active" : ""}`}
              onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button className={`nav-item ${isActive("/projects") && !location.pathname.includes("/dashboard") ? "active" : ""}`}
              onClick={() => { navigate("/projects"); setMobileOpen(false); }}>
              <FolderOpen size={18} /> Projects
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {user && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", marginBottom: 8 }}>
                <div className="avatar avatar-sm" style={{ background: "#8b5cf6" }}>{user.name.charAt(0)}</div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                </div>
              </div>
              <button className="nav-item" onClick={logout} style={{ color: "var(--danger)" }}>
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<GlobalDashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
