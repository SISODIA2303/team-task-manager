import { useState, useEffect } from "react";

import api from "../api/client";
import type { DashboardData } from "../types";
import { BarChart3, CheckCircle, Clock, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = { TODO: "#3b82f6", IN_PROGRESS: "#f59e0b", DONE: "#10b981" };
const PRIORITY_COLORS = { LOW: "#94a3b8", MEDIUM: "#3b82f6", HIGH: "#f59e0b", CRITICAL: "#ef4444" };

export default function GlobalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: d } = await api.get(`/dashboard`);
        setData(d);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="page-body"><p>Dashboard not available</p></div>;

  const statusData = [
    { name: "To Do", value: data.byStatus.TODO, color: STATUS_COLORS.TODO },
    { name: "In Progress", value: data.byStatus.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
    { name: "Done", value: data.byStatus.DONE, color: STATUS_COLORS.DONE },
  ];

  const priorityData = [
    { name: "Low", value: data.byPriority.LOW, fill: PRIORITY_COLORS.LOW },
    { name: "Medium", value: data.byPriority.MEDIUM, fill: PRIORITY_COLORS.MEDIUM },
    { name: "High", value: data.byPriority.HIGH, fill: PRIORITY_COLORS.HIGH },
    { name: "Critical", value: data.byPriority.CRITICAL, fill: PRIORITY_COLORS.CRITICAL },
  ];

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1><BarChart3 size={22} style={{ marginRight: 8, verticalAlign: "middle" }} />Global Overview</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Summary of tasks across all your projects</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--accent-primary-light)", color: "var(--accent-primary)" }}><BarChart3 size={20} /></div>
            <div className="stat-label">Active Projects</div>
            <div className="stat-value">{data.activeProjectsCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}><CheckCircle size={20} /></div>
            <div className="stat-label">Completed Projects</div>
            <div className="stat-value">{data.completedProjectsCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--info-light)", color: "var(--info)" }}><CheckCircle size={20} /></div>
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{data.totalTasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}><TrendingUp size={20} /></div>
            <div className="stat-label">Completion Rate</div>
            <div className="stat-value">{data.completionRate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}><Clock size={20} /></div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{data.byStatus.IN_PROGRESS}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--danger-light)", color: "var(--danger)" }}><AlertTriangle size={20} /></div>
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={ data.overdueCount > 0 ? { background: "none", WebkitTextFillColor: "var(--danger)", color: "var(--danger)" } : {}}>{data.overdueCount}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {/* Status Pie Chart */}
          <div className="chart-container">
            <h3>Tasks by Status</h3>
            {data.totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No tasks yet</p></div>}
          </div>

          {/* Priority Bar Chart */}
          <div className="chart-container">
            <h3>Tasks by Priority</h3>
            {data.totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No tasks yet</p></div>}
          </div>

          {/* Tasks per User */}
          <div className="chart-container">
            <h3><Users size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Tasks per Member</h3>
            {data.tasksByUser.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {data.tasksByUser.map((u, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>{u.completed}/{u.count} done</span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg-tertiary)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${u.count > 0 ? (u.completed / u.count) * 100 : 0}%`, background: "var(--accent-gradient)", borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty-state"><p>No assignments yet</p></div>}
          </div>

          {/* Overdue Tasks */}
          {data.overdueCount > 0 && (
            <div className="chart-container" style={{ borderColor: "var(--danger)", borderWidth: 2 }}>
              <h3 style={{ color: "var(--danger)" }}><AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Overdue Tasks</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {data.overdueTasks.map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--danger-light)", borderRadius: "var(--radius-md)", fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{t.title}</span>
                    <span style={{ color: "var(--danger)", fontSize: 12 }}>Due {new Date(t.dueDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
