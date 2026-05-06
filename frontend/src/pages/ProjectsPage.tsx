import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import type { Project } from "../types";
import { Plus, FolderOpen, Users, CheckSquare, X } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/projects", { name: newName, description: newDesc, dueDate: newDueDate || undefined });
      setShowModal(false);
      setNewName("");
      setNewDesc("");
      setNewDueDate("");
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>My Projects</h1>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={64} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Project
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project, i) => (
              <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{project.name}</h3>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className={`badge badge-${project.myRole?.toLowerCase()}`}>{project.myRole}</span>
                      <span className={`badge ${project.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                        {project.status === 'COMPLETED' ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <p>{project.description || "No description"}</p>
                <div className="project-card-footer">
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={14} /> {project.memberCount || project.createdBy?.length || 0}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckSquare size={14} /> {project.taskCount ?? project._count?.tasks ?? 0}
                  </span>
                  {project.dueDate && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: project.status !== 'COMPLETED' && new Date(project.dueDate) < new Date() ? "var(--danger)" : "inherit" }}>
                      📅 {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input id="project-name-input" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Website Redesign" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea id="project-desc-input" className="form-textarea" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What's this project about?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Deadline (Optional)</label>
                  <input type="date" className="form-input" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="project-create-submit" type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
