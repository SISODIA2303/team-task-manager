import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import type { Project, Task, TaskStatus, Priority } from "../types";
import { useAuth } from "../context/AuthContext";
import { Plus, X, Calendar, AlertCircle, UserPlus, Trash2, Clock, LayoutDashboard } from "lucide-react";
import { format, isPast } from "date-fns";

const STATUS_LABELS: Record<TaskStatus, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_COLORS: Record<TaskStatus, string> = { TODO: "#3b82f6", IN_PROGRESS: "#f59e0b", DONE: "#10b981" };
const PRIORITY_LABELS: Record<Priority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Audit Log
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Project Edit form
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [editProjName, setEditProjName] = useState("");
  const [editProjDesc, setEditProjDesc] = useState("");
  const [editProjStatus, setEditProjStatus] = useState<"ACTIVE"|"COMPLETED">("ACTIVE");
  const [editProjDueDate, setEditProjDueDate] = useState("");
  const [updatingProj, setUpdatingProj] = useState(false);

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [creating, setCreating] = useState(false);

  // Member form
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const isAdmin = project?.myRole === "ADMIN";

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setEditProjName(projRes.data.name);
      setEditProjDesc(projRes.data.description || "");
      setEditProjStatus(projRes.data.status || "ACTIVE");
      setEditProjDueDate(projRes.data.dueDate ? projRes.data.dueDate.substring(0, 10) : "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleOpenAuditLog = async () => {
    setShowAuditModal(true);
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/projects/${id}/activities`);
      setAuditLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoadingLogs(false); }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjName.trim()) return;
    setUpdatingProj(true);
    try {
      await api.put(`/projects/${id}`, {
        name: editProjName,
        description: editProjDesc,
        status: editProjStatus,
        dueDate: editProjDueDate || null
      });
      setShowEditProjModal(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setUpdatingProj(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreating(true);
    try {
      await api.post(`/projects/${id}/tasks`, {
        title: taskTitle, description: taskDesc, priority: taskPriority,
        dueDate: taskDueDate || null, assignedToId: taskAssignee || null,
      });
      setShowTaskModal(false);
      resetTaskForm();
      fetchData();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const resetTaskForm = () => { setTaskTitle(""); setTaskDesc(""); setTaskPriority("MEDIUM"); setTaskDueDate(""); setTaskAssignee(""); };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
      if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      setSelectedTask(null);
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError("");
    setAddingMember(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail("");
      setShowMemberModal(false);
      fetchData();
    } catch (err: any) {
      setMemberError(err.response?.data?.error || "Failed to add member");
    } finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!project) return <div className="page-body"><p>Project not found</p></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>{project.name}</h1>
            <span className={`badge ${project.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
              {project.status === 'COMPLETED' ? 'Completed' : 'Active'}
            </span>
            {project.dueDate && (
              <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}>
                <Calendar size={14} /> {new Date(project.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {project.description && <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/projects/${id}/dashboard`} className="btn btn-secondary">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <button className="btn btn-secondary" onClick={handleOpenAuditLog}>
            <Clock size={16} /> Audit Log
          </button>
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowEditProjModal(true)}>Edit Project</button>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}><UserPlus size={16} /> Add Member</button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={16} /> Add Task</button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Members Strip */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginRight: 4 }}>Team:</span>
          {project.createdBy?.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-tertiary)", padding: "4px 10px 4px 4px", borderRadius: "var(--radius-full)", fontSize: 12 }}>
              <div className="avatar avatar-sm" style={{ background: stringToColor(m.user.name) }}>{m.user.name.charAt(0)}</div>
              <span style={{ fontWeight: 500 }}>{m.user.name}</span>
              <span className={`badge badge-${m.role.toLowerCase()}`} style={{ fontSize: 9, padding: "1px 6px" }}>{m.role}</span>
              {isAdmin && m.userId !== project.createdById && (
                <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.userId); }}><X size={12} /></button>
              )}
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map(status => (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] }} />
                  {STATUS_LABELS[status]}
                </div>
                <span className="kanban-column-count">{tasksByStatus(status).length}</span>
              </div>
              {tasksByStatus(status).map(task => (
                <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{PRIORITY_LABELS[task.priority]}</span>
                    {task.taskLabels?.map(tl => (
                      <span key={tl.label.id} style={{ fontSize: 10, padding: "1px 6px", borderRadius: "var(--radius-full)", background: tl.label.color + "22", color: tl.label.color, fontWeight: 600 }}>{tl.label.name}</span>
                    ))}
                  </div>
                  <div className="task-card-title">{task.title}</div>
                  <div className="task-card-meta">
                    {task.dueDate && (
                      <span className={`task-card-due ${isPast(new Date(task.dueDate)) && task.status !== "DONE" ? "overdue" : ""}`}>
                        {isPast(new Date(task.dueDate)) && task.status !== "DONE" ? <AlertCircle size={12} /> : <Calendar size={12} />}
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                    {task.assignedTo && (
                      <div className="avatar avatar-sm" style={{ background: stringToColor(task.assignedTo.name), marginLeft: "auto" }} title={task.assignedTo.name}>
                        {task.assignedTo.name.charAt(0)}
                      </div>
                    )}
                    {(task._count?.comments ?? 0) > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>💬 {task._count?.comments}</span>
                    )}
                  </div>
                </div>
              ))}
              {tasksByStatus(status).length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-tertiary)", fontSize: 13 }}>No tasks</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedTask(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{selectedTask.title}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTask(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {selectedTask.description && <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>{selectedTask.description}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <span className="form-label">Status</span>
                  <select 
                    className="form-select" 
                    value={selectedTask.status} 
                    onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                    disabled={!isAdmin && selectedTask.assignedTo?.id !== user?.id}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE" disabled={!isAdmin}>Done</option>
                  </select>
                </div>
                <div>
                  <span className="form-label">Priority</span>
                  <span className={`badge badge-${selectedTask.priority.toLowerCase()}`}>{PRIORITY_LABELS[selectedTask.priority]}</span>
                </div>
                <div>
                  <span className="form-label">Assignee</span>
                  <span style={{ fontSize: 14 }}>{selectedTask.assignedTo?.name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="form-label">Due Date</span>
                  <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={14} />
                    {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), "MMM d, yyyy") : "No due date"}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Created by {selectedTask.createdBy?.name} on {format(new Date(selectedTask.createdAt), "MMM d, yyyy")}
              </div>
            </div>
            {isAdmin && (
              <div className="modal-footer">
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(selectedTask.id)}>
                  <Trash2 size={14} /> Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Task</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowTaskModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Describe the task..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input className="form-input" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {project.createdBy?.map((m) => (
                      <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Creating..." : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Add Team Member</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowMemberModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                {memberError && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "8px 12px", borderRadius: "var(--radius-md)", marginBottom: 14, fontSize: 13 }}>{memberError}</div>}
                <div className="form-group">
                  <label className="form-label">Member Email</label>
                  <input className="form-input" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="teammate@example.com" required autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addingMember}>{addingMember ? "Adding..." : "Add Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* Edit Project Modal */}
      {showEditProjModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditProjModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditProjModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input className="form-input" value={editProjName} onChange={(e) => setEditProjName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={editProjDesc} onChange={(e) => setEditProjDesc(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={editProjStatus} onChange={(e) => setEditProjStatus(e.target.value as any)}>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={editProjDueDate} onChange={(e) => setEditProjDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProjModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updatingProj}>{updatingProj ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAuditModal(false)}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <h2><Clock size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />Project Audit Log</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAuditModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", flex: 1, padding: 20 }}>
              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
              ) : auditLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>No activity found.</div>
              ) : (
                <div className="activity-timeline" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {auditLogs.map((log) => (
                    <div key={log.id} style={{ display: "flex", gap: 12, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                      <div className="avatar avatar-sm" style={{ background: stringToColor(log.user.name) }}>{log.user.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14 }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.user.name}</span>
                          <span style={{ color: "var(--text-secondary)", margin: "0 6px" }}>
                            {log.action === "PROJECT_CREATED" && "created the project"}
                            {log.action === "PROJECT_UPDATED" && "updated project settings"}
                            {log.action === "MEMBER_ADDED" && `added member ${log.metadata?.addedUser}`}
                            {log.action === "MEMBER_REMOVED" && `removed member ${log.metadata?.removedUser}`}
                            {log.action === "CREATED" && "created task"}
                            {log.action === "UPDATED" && "updated task"}
                            {log.action === "STATUS_CHANGED" && `changed task status to ${log.metadata?.to}`}
                            {log.action === "COMMENT_ADDED" && "commented on task"}
                          </span>
                          {log.task && <span style={{ fontWeight: 600 }}>"{log.task.title}"</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                          {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6", "#14b8a6"];
  return colors[Math.abs(hash) % colors.length];
}
